#!/usr/bin/env bash
# Export the Win11Store XenForo add-on owned by this repository.
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source_dir="$repo_root/addon/Win11Store/"
destination_dir="${ADDON_DEST:-/web/public_html/src/addons/Win11Store/}"

if [[ ! -d "$source_dir" ]]; then
  printf 'Missing add-on source: %s\n' "$source_dir" >&2
  exit 1
fi

case "$destination_dir" in
  /web/public_html/src/addons/Win11Store/|/web/public_html/src/addons/Win11Store) ;;
  *) printf 'Refusing unexpected add-on destination: %s\n' "$destination_dir" >&2; exit 1 ;;
esac

mkdir -p "$destination_dir"
rsync -a --delete --exclude='.git' "$source_dir" "$destination_dir"
printf 'Exported Win11Store XenForo add-on to %s\n' "$destination_dir"
