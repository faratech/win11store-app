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

# A valid, trusted signature is not proof that we signed something, so the
# identities are pinned and compared as parsed name attributes, exactly.
#
# Every package manifest carries the Partner Center publisher of the
# 32827MikeFara account. Partner Center re-signs Store uploads with a
# certificate of this subject, and a signed sideload package must be signed
# by a certificate whose subject equals its manifest publisher.
$ExpectedPackagePublisherCN = 'ABDB6B3F-DF9E-447D-BC0E-4DA7BAFD14C4'
# The direct-download helper must carry the primary signature faratech's
# Trusted Signing account puts on executables (profile Faratech).
$ExpectedHelperSigner = [ordered]@{
	CN = 'Fara Technologies LLC'
	O = 'Fara Technologies LLC'
}

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

function Get-NameAttributes
{
	param([System.Security.Cryptography.X509Certificates.X500DistinguishedName]$Name)

	# One "key=value" line per attribute, parsed by the platform rather than
	# by matching inside the formatted string. A line break inside a value
	# would forge extra attribute lines, so such names are refused outright
	# (the single-line form only contains one if a value does).
	$singleLine = $Name.Decode([System.Security.Cryptography.X509Certificates.X500DistinguishedNameFlags]::None)
	if ($singleLine -match '[\r\n]')
	{
		throw 'Name has an attribute value containing a line break.'
	}

	$flags = [System.Security.Cryptography.X509Certificates.X500DistinguishedNameFlags]'UseNewLines, DoNotUseQuotes'
	foreach ($line in ($Name.Decode($flags) -split "\r?\n"))
	{
		if ($line -match '^(?<key>[^=]+)=(?<value>.*)$')
		{
			[pscustomobject]@{ Key = $Matches.key.Trim(); Value = $Matches.value }
		}
		elseif ($line)
		{
			throw "Unparseable name attribute: $line"
		}
	}
}

function Get-SingleNameAttribute
{
	param(
		[object[]]$Attributes,
		[string]$Key
	)

	$values = @($Attributes | Where-Object { $_.Key -ceq $Key })
	if ($values.Count -ne 1)
	{
		return $null
	}

	return $values[0].Value
}

function Get-PublisherCommonName
{
	param([string]$Publisher)

	$name = [System.Security.Cryptography.X509Certificates.X500DistinguishedName]::new($Publisher)
	$commonName = Get-SingleNameAttribute -Attributes @(Get-NameAttributes $name) -Key 'CN'
	if ($null -eq $commonName)
	{
		throw "Publisher '$Publisher' does not have exactly one CN."
	}

	return $commonName
}

function Get-CanonicalName
{
	param([System.Security.Cryptography.X509Certificates.X500DistinguishedName]$Name)

	return $Name.Decode([System.Security.Cryptography.X509Certificates.X500DistinguishedNameFlags]::None)
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

if ($publisherNames[0] -cne $ExpectedPackagePublisherCN)
{
	throw "Package publisher CN=$($publisherNames[0]) is not the expected CN=$ExpectedPackagePublisherCN."
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

	# Windows installs a signed package only when the signing certificate's
	# subject equals the manifest publisher, and that publisher's CN is pinned
	# above; so any other signer, however trusted, fails here.
	$packageSignature = Get-AuthenticodeSignature -LiteralPath $sideloadRecord.Path
	if ($packageSignature.Status -ne 'Valid' -or -not $packageSignature.SignerCertificate)
	{
		throw "WindowsForum.sideload.msix signature status is $($packageSignature.Status)."
	}

	$packageSigner = Get-CanonicalName $packageSignature.SignerCertificate.SubjectName
	$manifestPublisher = Get-CanonicalName ([System.Security.Cryptography.X509Certificates.X500DistinguishedName]::new($sideloadRecord.Publisher))
	if ($packageSigner -cne $manifestPublisher)
	{
		throw "WindowsForum.sideload.msix is signed by '$packageSigner', not its manifest publisher '$manifestPublisher'."
	}

	$helperPath = Join-Path -Path $Root -ChildPath 'utils\pwainstaller.exe'
	$helperSignature = Get-AuthenticodeSignature -LiteralPath $helperPath
	if ($helperSignature.Status -ne 'Valid' -or -not $helperSignature.SignerCertificate)
	{
		throw "Direct-download helper signature status is $($helperSignature.Status)."
	}

	$helperSigner = @(Get-NameAttributes $helperSignature.SignerCertificate.SubjectName)
	foreach ($key in $ExpectedHelperSigner.Keys)
	{
		$actual = Get-SingleNameAttribute -Attributes $helperSigner -Key $key
		if ($actual -cne $ExpectedHelperSigner[$key])
		{
			throw "Direct-download helper is signed by '$($helperSignature.SignerCertificate.Subject)', expected $key=$($ExpectedHelperSigner[$key])."
		}
	}

	Write-Host 'Direct sideload package and helper signatures verified.'
}

Write-Host "Release verification succeeded for $($records.Count) package(s)."
