#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

uvicorn backend.app:app --host "${LOCAL_STUDIO_HOST:-127.0.0.1}" --port "${LOCAL_STUDIO_PORT:-8000}"
