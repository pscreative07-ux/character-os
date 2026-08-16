Param(
    [string]$HostAddr = $(if ($env:LOCAL_STUDIO_HOST) { $env:LOCAL_STUDIO_HOST } else { "127.0.0.1" }),
    [string]$Port = $(if ($env:LOCAL_STUDIO_PORT) { $env:LOCAL_STUDIO_PORT } else { "8000" })
)

Set-Location $PSScriptRoot

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}

. .\.venv\Scripts\Activate.ps1
pip install --upgrade pip -q
pip install -r requirements.txt -q

uvicorn backend.app:app --host $HostAddr --port $Port
