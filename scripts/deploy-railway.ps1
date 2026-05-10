param(
  [string]$ProjectName = "EtharaAI",
  [string]$ServiceName = "ethara",
  [string]$DatabaseName = "Postgres"
)

$ErrorActionPreference = "Stop"

function Assert-Command($Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is not installed or is not on PATH."
  }
}

function Invoke-Railway {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

  & railway @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "railway $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

function Read-DotEnv($Path) {
  $values = @{}
  if (-not (Test-Path $Path)) {
    return $values
  }

  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $index = $trimmed.IndexOf("=")
    if ($index -lt 1) {
      continue
    }

    $key = $trimmed.Substring(0, $index).Trim()
    $value = $trimmed.Substring($index + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $values[$key] = $value
  }

  return $values
}

function Get-ServiceNames {
  $json = & railway service list --json
  if ($LASTEXITCODE -ne 0 -or -not $json) {
    return @()
  }

  $services = $json | ConvertFrom-Json
  return @($services | ForEach-Object { $_.name })
}

function Ensure-Service {
  param(
    [string]$Name,
    [string]$Kind
  )

  $serviceNames = Get-ServiceNames
  if ($serviceNames -contains $Name) {
    return
  }

  if ($Kind -eq "postgres") {
    Invoke-Railway add --database postgres --service $Name --json
  } else {
    Invoke-Railway add --service $Name --json
  }
}

function Set-Variable {
  param(
    [string]$Name,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    Write-Host "Skipping $Name because no value was found locally."
    return
  }

  Invoke-Railway variable set "$Name=$Value" --service $ServiceName --skip-deploys
}

Assert-Command railway

if (-not $env:RAILWAY_TOKEN -and -not $env:RAILWAY_API_TOKEN) {
  throw "Set RAILWAY_TOKEN first. Create one at https://railway.com/account/tokens, then run: `$env:RAILWAY_TOKEN='paste-token-here'"
}

Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  & railway status *> $null
  if ($LASTEXITCODE -ne 0) {
    Invoke-Railway init --name $ProjectName --json
  }

  Ensure-Service -Name $DatabaseName -Kind "postgres"
  Ensure-Service -Name $ServiceName -Kind "web"

  $databaseUrlReference = '$' + "{{" + $DatabaseName + ".DATABASE_URL}}"
  Set-Variable -Name "DATABASE_URL" -Value $databaseUrlReference
  Set-Variable -Name "NODE_ENV" -Value "production"

  $frontendEnv = Read-DotEnv "frontend\.env"
  foreach ($key in @(
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_FIREBASE_MEASUREMENT_ID"
  )) {
    Set-Variable -Name $key -Value $frontendEnv[$key]
  }

  if (Test-Path "backend\serviceAccount.json") {
    $serviceAccountJson = Get-Content "backend\serviceAccount.json" -Raw
    $serviceAccountJson | railway variable set FIREBASE_SERVICE_ACCOUNT_JSON --stdin --service $ServiceName --skip-deploys
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to set FIREBASE_SERVICE_ACCOUNT_JSON."
    }
  } else {
    Write-Host "backend\serviceAccount.json was not found. Set FIREBASE_SERVICE_ACCOUNT_JSON manually in Railway."
  }

  try {
    Invoke-Railway domain --service $ServiceName --json
  } catch {
    Write-Host "Domain may already exist. Continuing to deploy."
  }

  Invoke-Railway up --service $ServiceName
  Invoke-Railway status
} finally {
  Pop-Location
}
