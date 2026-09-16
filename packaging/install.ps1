#Requires -Version 5.1

[CmdletBinding()]
param(
	[switch]$NoLaunch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptRoot))
{
	$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
}

$packageIdentity = '32827MikeFara.WindowsForum.com'
$applicationId = 'App'
$minimumWindowsVersion = [Version]'10.0.19041.0'
$packagePath = Join-Path -Path $scriptRoot -ChildPath 'WindowsForum.sideload.msix'
$installerPath = Join-Path -Path $scriptRoot -ChildPath 'utils\pwainstaller.exe'

foreach ($requiredFile in @($packagePath, $installerPath))
{
	if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf))
	{
		throw "Required file not found: $requiredFile"
	}
}

$operatingSystem = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
if (-not $operatingSystem -or [string]::IsNullOrWhiteSpace($operatingSystem.Version))
{
	throw 'Unable to determine the Windows version.'
}

$currentWindowsVersion = [Version]$operatingSystem.Version
if ($currentWindowsVersion -lt $minimumWindowsVersion)
{
	throw "WindowsForum requires Windows version $minimumWindowsVersion or greater. Detected $currentWindowsVersion."
}

Write-Host 'Installing WindowsForum...'
$quotedPackagePath = '"{0}"' -f $packagePath
$installProc = Start-Process -FilePath $installerPath -ArgumentList $quotedPackagePath -WorkingDirectory $scriptRoot -NoNewWindow -Wait -PassThru -ErrorAction Stop
if ($installProc.ExitCode -ne 0)
{
	throw "Installation failed. pwainstaller.exe exited with code $($installProc.ExitCode)."
}

# Package registration can finish just after the helper exits. Give AppX a short
# window to publish the package before attempting to launch it.
$installedApp = $null
for ($attempt = 0; $attempt -lt 60; $attempt++)
{
	$installedApp = @(Get-AppxPackage -Name $packageIdentity -ErrorAction SilentlyContinue |
		Sort-Object Version -Descending |
		Select-Object -First 1)
	if ($installedApp.Count -gt 0)
	{
		$installedApp = $installedApp[0]
		break
	}

	Start-Sleep -Milliseconds 500
}

if (-not $installedApp)
{
	throw "Installation completed, but package $packageIdentity was not registered for the current user."
}

if ($NoLaunch)
{
	Write-Host "Installed $($installedApp.Name) version $($installedApp.Version)."
	return
}

$applicationUserModelId = '{0}!{1}' -f $installedApp.PackageFamilyName, $applicationId
Write-Host 'Launching WindowsForum...'
Start-Process -FilePath 'explorer.exe' -ArgumentList ('shell:AppsFolder\{0}' -f $applicationUserModelId) -ErrorAction Stop
