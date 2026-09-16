# WindowsForum Windows Release Notes

This directory contains Windows Chromium PWA release artifacts. The Store
packages and the sideload installer are separate distribution paths:

- `WindowsForum.msixbundle` is the modern Store-style bundle.
- `WindowsForum.classic.appxbundle` is the legacy classic bundle.
- `WindowsForum.sideload.msix` is installed locally by `install.ps1`.
- `utils/pwainstaller.exe` is a local helper and is not uploaded inside a Store package.

## Refresh procedure

1. Verify the current canonical site manifest at
   `https://windowsforum.com/webmanifest.php` and confirm that the WindowsForum
   site and service worker are healthy.
   Keep `public_html/site.webmanifest` semantically aligned with that rendered
   manifest for clients that request the static fallback.
2. Generate all three Windows packages from the current PWA using the
   PWABuilder Windows Chromium packaging flow.
3. Preserve package identity `32827MikeFara.WindowsForum.com`, the existing
   publisher, and the upgrade path. Increment the modern/sideload variants to
   `1.0.2.0` and the classic variant to `1.0.1.0`; the modern version must
   remain newer than the classic version.
4. For Store submission, upload only `WindowsForum.msixbundle` and
   `WindowsForum.classic.appxbundle`. Partner Center signs the Store packages;
   do not require local signatures for this gate. For a separate direct-download
   release, sign `WindowsForum.sideload.msix` and `utils/pwainstaller.exe` with
   the certificate trusted by that distribution channel. Never commit
   certificates, private keys, or signing exports.
5. Replace the complete matching artifact set. From this directory, regenerate
   `SHA256SUMS` with:

   `sha256sum WindowsForum.classic.appxbundle WindowsForum.msixbundle WindowsForum.sideload.msix install.ps1 readme.html utils/pwainstaller.exe RELEASE.md verify-release.ps1 > SHA256SUMS`

   Then run the Store gate:

   `.\verify-release.ps1 -ExpectedModernVersion 1.0.2.0 -ExpectedClassicVersion 1.0.1.0`

   For a signed direct-download release, run the same command with
   `-RequireSignatures`.

The current checked-in baseline predates the live PWA improvements: the
modern/sideload packages are version `1.0.1.0`, while the classic bundle is
version `1.0.0.0`. The ordering is correct, but the artifacts are stale
relative to the live manifest. The absence of local signatures is not a Store
submission blocker, but it does prevent direct sideload distribution until the
sideload package and helper are signed.

## Acceptance checks

Test the sideload package on Windows 10 build 19041 and current Windows 11,
including invocation from a different working directory and both default and
`-NoLaunch` installer modes. Confirm the exact package is registered and
launches, then smoke-test the current PWA start URL, shortcuts, share target,
notifications, offline drafts, and service-worker update.
