# Repository Guidelines

## Project Structure

This directory is the WindowsForum PWA release-artifact slice of the `/web`
monorepo; application source and build projects live elsewhere. Keep these
artifacts together:

- `WindowsForum.sideload.msix` is the package consumed by `install.ps1`.
- `WindowsForum.msixbundle` and `WindowsForum.classic.appxbundle` are alternate bundle outputs.
- `install.ps1` checks Windows version, runs `utils/pwainstaller.exe`, and launches the installed app.
- `verify-release.ps1`, `RELEASE.md`, and `SHA256SUMS` provide release checks.
- `readme.html` provides installation and package guidance.

Package manifests, icons, and other assets are embedded in the archives. Make source and build changes in their upstream project, then replace complete, matching artifacts here; do not hand-edit an archive.

## Build, Install, and Development

No build or lint command is defined locally. In Windows PowerShell, run
`Set-ExecutionPolicy -Scope Process Bypass`, then `.\install.ps1`. The installer
requires Windows 10.0.19041 or later and uses the sideload package. Run
`.\verify-release.ps1` to check manifests and checksums; add expected
modern/classic versions for a Store gate. Add `-RequireSignatures` only for a
separately signed direct-sideload release; Partner Center signs Store submissions.

Before delivery, check archive integrity with `unzip -t <package>` for each of the three MSIX/AppX archives. The modern and sideload packages should share a version, while the classic package should remain older; do not force all variants to the same version.

## Testing

There is no automated suite or coverage target. For installer changes, smoke-test
on supported Windows: the script succeeds, the package appears in Start, and it
opens windowsforum.com. For package refreshes, test sideload installation and
inspect every changed bundle. Record failures and the OS build in review.

## Style

Preserve exact filenames and case. Keep PowerShell variables descriptive and use camelCase (`$scriptRoot`, `$packagePath`), keep comments short, and retain UTF-8-with-BOM encoding. Do not reformat or binary-edit artifacts; use the packaging toolchain. No formatter or linter is configured here.

## Commits and Review

Use focused commits with `<area>(<scope>): <summary>` (for example,
`fix(winapp): refresh package artifacts`). Describe package versions, provenance,
hashes when relevant, and validation. Link issues and attach screenshots for UI
changes. From `/web`, stage explicit paths such as `git add winapp/AGENTS.md`;
never use broad staging.

## Security

Treat MSIX/AppX bundles, the helper EXE, and installer script as executable release content. Verify provenance and hashes before distribution; require signatures for direct sideload releases, while Store submission inputs are signed by Partner Center. Keep secrets out of this directory and retain the installer's process-scoped execution-policy bypass.
