#!/usr/bin/env bash
set -euo pipefail

host="${1:-Oracle_Ampere}"
remote_dir="/home/ubuntu/akjo-analytics"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
service_dir="$(cd "${script_dir}/.." && pwd)"

rsync -az --delete \
  --exclude '.env' \
  --exclude 'data' \
  --exclude 'node_modules' \
  "${service_dir}/" "${host}:${remote_dir}/"

ssh "${host}" "cd '${remote_dir}' && docker compose up -d --build"
