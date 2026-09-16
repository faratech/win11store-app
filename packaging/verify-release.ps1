#Requires -Version 5.1

[CmdletBinding()]
param(
	[string]$Root = $PSScriptRoot,
	[Version]$ExpectedModernVersion,
	[Version]$ExpectedClassicVersion,
	# Store submissions are signed by Partner Center. Use this switch only for
	# a separately signed sideload/direct-download release.
	[switch]$RequireSignatures
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

if ([string]::IsNullOrWhiteSpace($Root))
{
	$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
}

function Get-ZipEntryText
{
	param(
		[string]$ArchivePath,
		[string]$EntryName
	)

	$archive = [System.IO.Compression.ZipFile]::OpenRead($ArchivePath)
	try
	{
		$entry = $archive.GetEntry($EntryName)
		if (-not $entry)
		{
			throw "Entry $EntryName was not found in $ArchivePath."
		}

		$reader = [System.IO.StreamReader]::new($entry.Open())
		try
		{
			return $reader.ReadToEnd()
		}
		finally
		{
			$reader.Dispose()
		}
	}
	finally
	{
		$archive.Dispose()
	}
}

function Get-PackageRecord
{
	param(
		[string]$FileName,
		[string]$ManifestEntry
	)

	$path = Join-Path -Path $Root -ChildPath $FileName
	if (-not (Test-Path -LiteralPath $path -PathType Leaf))
	{
		throw "Release file not found: $path"
	}

	$manifest = [xml](Get-ZipEntryText -ArchivePath $path -EntryName $ManifestEntry)
	$identity = $manifest.SelectSingleNode("//*[local-name()='Identity']")
	if (-not $identity)
	{
		throw "No Identity element found in $path."
	}

	$record = [pscustomobject]@{
		Path = $path
		FileName = $FileName
		Identity = [string]$identity.Name
		Publisher = [string]$identity.Publisher
		Version = [Version][string]$identity.Version
	}

	if ($FileName -eq 'WindowsForum.sideload.msix')
	{
		$application = $manifest.SelectSingleNode("//*[local-name()='Application' and @Id='App']")
		if (-not $application)
		{
			throw "The sideload package does not declare application ID App."
		}
	}

	return $record
}

function Get-PublisherCommonName
{
	param([string]$Publisher)

	$match = [regex]::Match($Publisher, 'CN=[^,]+')
	if ($match.Success)
	{
		return $match.Value
	}

	return $Publisher
}

function Test-ArchiveHasSignature
{
	param([string]$ArchivePath)

	$archive = [System.IO.Compression.ZipFile]::OpenRead($ArchivePath)
	try
	{
		if ($archive.GetEntry('AppxSignature.p7x'))
		{
			return $true
		}

		$nestedPackages = @($archive.Entries | Where-Object { $_.FullName -match '\.appx$' })
		if ($nestedPackages.Count -eq 0)
		{
			return $false
		}

		foreach ($entry in $nestedPackages)
		{
			$memoryStream = [System.IO.MemoryStream]::new()
			$entryStream = $entry.Open()
			try
			{
				$entryStream.CopyTo($memoryStream)
			}
			finally
			{
				$entryStream.Dispose()
			}

			$memoryStream.Position = 0
			$nestedArchive = [System.IO.Compression.ZipArchive]::new(
				$memoryStream,
				[System.IO.Compression.ZipArchiveMode]::Read,
				$false
			)
			try
			{
				if (-not $nestedArchive.GetEntry('AppxSignature.p7x'))
				{
					return $false
				}
			}
			finally
			{
				$nestedArchive.Dispose()
				$memoryStream.Dispose()
			}
		}

		return $true
	}
	finally
	{
		$archive.Dispose()
	}
}

function Test-Checksums
{
	$checksumPath = Join-Path -Path $Root -ChildPath 'SHA256SUMS'
	if (-not (Test-Path -LiteralPath $checksumPath -PathType Leaf))
	{
		throw "Checksum file not found: $checksumPath"
	}

	$checked = 0
	foreach ($line in Get-Content -LiteralPath $checksumPath)
	{
		if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#'))
		{
			continue
		}

		if ($line -notmatch '^(?<hash>[0-9a-fA-F]{64})\s+[*]?(?<file>.+)$')
		{
			throw "Invalid checksum line: $line"
		}

		$relativePath = $Matches.file.Trim()
		$targetPath = Join-Path -Path $Root -ChildPath $relativePath
		if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf))
		{
			throw "Checksum target not found: $targetPath"
		}

		$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $targetPath).Hash
		if ($actualHash -ne $Matches.hash.ToUpperInvariant())
		{
			throw "Checksum mismatch for $relativePath."
		}

		$checked++
	}

	if ($checked -eq 0)
	{
		throw "Checksum file contains no entries."
	}

	Write-Host "Checksums verified: $checked file(s)."
}

$records = @(
	Get-PackageRecord -FileName 'WindowsForum.sideload.msix' -ManifestEntry 'AppxManifest.xml'
	Get-PackageRecord -FileName 'WindowsForum.msixbundle' -ManifestEntry 'AppxMetadata/AppxBundleManifest.xml'
	Get-PackageRecord -FileName 'WindowsForum.classic.appxbundle' -ManifestEntry 'AppxMetadata/AppxBundleManifest.xml'
)

$identityNames = @($records | Select-Object -ExpandProperty Identity -Unique)
if ($identityNames.Count -ne 1 -or $identityNames[0] -ne '32827MikeFara.WindowsForum.com')
{
	throw "Package identity mismatch: $($identityNames -join ', ')."
}

$publisherNames = @($records | ForEach-Object { Get-PublisherCommonName $_.Publisher } | Select-Object -Unique)
if ($publisherNames.Count -ne 1)
{
	throw "Package publisher mismatch: $($publisherNames -join ', ')."
}

$modernRecords = @($records | Where-Object { $_.FileName -in @('WindowsForum.sideload.msix', 'WindowsForum.msixbundle') })
$classicRecord = $records | Where-Object { $_.FileName -eq 'WindowsForum.classic.appxbundle' }
$modernVersions = @($modernRecords | Select-Object -ExpandProperty Version -Unique)
if ($modernVersions.Count -ne 1)
{
	throw "Modern package versions are not aligned: $($modernRecords | ForEach-Object { "$($_.FileName)=$($_.Version)" } -join ', ')."
}

if ($classicRecord.Version -ge $modernVersions[0])
{
	throw "Classic package version $($classicRecord.Version) must be older than modern package version $($modernVersions[0])."
}

if ($ExpectedModernVersion)
{
	foreach ($record in $modernRecords)
	{
		if ($record.Version -ne $ExpectedModernVersion)
		{
			throw "$($record.FileName) is version $($record.Version), expected modern version $ExpectedModernVersion."
		}
	}
}

if ($ExpectedClassicVersion -and $classicRecord.Version -ne $ExpectedClassicVersion)
{
	throw "$($classicRecord.FileName) is version $($classicRecord.Version), expected classic version $ExpectedClassicVersion."
}

Test-Checksums

if ($RequireSignatures)
{
	$signtool = Get-Command signtool.exe -ErrorAction SilentlyContinue
	if (-not $signtool)
	{
		throw 'Direct sideload signature verification requires signtool.exe from the Windows SDK.'
	}

	$sideloadRecord = $records | Where-Object { $_.FileName -eq 'WindowsForum.sideload.msix' }
	if (-not (Test-ArchiveHasSignature -ArchivePath $sideloadRecord.Path))
	{
		throw 'WindowsForum.sideload.msix does not contain an AppX signature.'
	}

	& $signtool.Source verify /pa /all $sideloadRecord.Path
	if ($LASTEXITCODE -ne 0)
	{
		throw 'signtool verification failed for WindowsForum.sideload.msix.'
	}

	$helperPath = Join-Path -Path $Root -ChildPath 'utils\pwainstaller.exe'
	$helperSignature = Get-AuthenticodeSignature -LiteralPath $helperPath
	if ($helperSignature.Status -ne 'Valid')
	{
		throw "Direct-download helper signature status is $($helperSignature.Status)."
	}

	Write-Host 'Direct sideload package and helper signatures verified.'
}

Write-Host "Release verification succeeded for $($records.Count) package(s)."
