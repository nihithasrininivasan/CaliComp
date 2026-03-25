$ErrorActionPreference = "Stop"
Set-Location -Path "C:\Users\sheri\OneDrive\Desktop\CaliComp\backend"

if (!(Test-Path ".\.pgsql")) {
    Write-Host "Downloading PostgreSQL binaries..."
    Invoke-WebRequest -Uri "https://get.enterprisedb.com/postgresql/postgresql-10.23-1-windows-x64-binaries.zip" -OutFile "pgsql.zip"
    Write-Host "Extracting..."
    Expand-Archive -Path "pgsql.zip" -DestinationPath "." -Force
    Rename-Item -Path "pgsql" -NewName ".pgsql"
    Remove-Item "pgsql.zip"
}

if (!(Test-Path ".\.pgsql\data")) {
    Write-Host "Initializing Database..."
    Set-Content -Path "pw.txt" -Value "password"
    & ".\.pgsql\bin\initdb.exe" -D ".\.pgsql\data" -U postgres --pwfile="pw.txt" --auth=trust
    Remove-Item "pw.txt"
}

Write-Host "Starting PostgreSQL on port 5432..."
Start-Process -NoNewWindow -Wait -FilePath ".\.pgsql\bin\pg_ctl.exe" -ArgumentList "-D .\.pgsql\data -l logfile start"
Start-Sleep -Seconds 5

Write-Host "Creating database calicomp..."
try {
    & ".\.pgsql\bin\createdb.exe" -U postgres -p 5432 calicomp
} catch {
    Write-Host "Database might already exist."
}

Write-Host "Running Alembic migrations..."
& ".\venv\Scripts\Activate.ps1"
$env:PYTHONPATH = "."
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head

Write-Host "Done!"
