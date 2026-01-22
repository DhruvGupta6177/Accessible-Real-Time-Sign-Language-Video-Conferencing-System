# Windows PowerShell script to generate self-signed certificates for development

$certsDir = "$PSScriptRoot\..\certs"
$certFile = "$certsDir\cert.pem"
$keyFile = "$certsDir\key.pem"
$pfxFile = "$certsDir\cert.pfx"

# Create certs directory if it doesn't exist
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
    Write-Host "✓ Created certs directory"
}

# Check if certificates already exist
if ((Test-Path $certFile) -and (Test-Path $keyFile)) {
    Write-Host "✓ Certificates already exist"
    exit 0
}

Write-Host "🔒 Generating self-signed certificates for HTTPS..."

# Get local network IP
$ipAddress = (
    Get-NetIPConfiguration |
    Where-Object { $_.IPv4DefaultGateway -ne $null } |
    Select-Object -ExpandProperty IPv4Address |
    Select-Object -First 1 -ExpandProperty IPAddress
)

if (-not $ipAddress) {
    $ipAddress = "192.168.1.1"
}

Write-Host "   Generating certificate for: localhost, 127.0.0.1, $ipAddress"

# Create self-signed certificate using PowerShell
$cert = New-SelfSignedCertificate `
    -Subject "CN=localhost" `
    -DnsName "localhost", "127.0.0.1", $ipAddress `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(1) `
    -KeyUsage KeyEncipherment, DataEncipherment `
    -ExtendedKeyUsage "Server Authentication"

Write-Host "✓ Created certificate: $($cert.Thumbprint)"

# Export certificate as PEM
$certPath = [System.IO.Path]::GetTempFileName()
Export-Certificate -Cert $cert -FilePath $certPath -Type CERT | Out-Null

$certContent = @"
-----BEGIN CERTIFICATE-----
$([Convert]::ToBase64String([System.IO.File]::ReadAllBytes($certPath), [System.Base64FormattingOptions]::InsertLineBreaks))
-----END CERTIFICATE-----
"@

Set-Content -Path $certFile -Value $certContent -Encoding ASCII
Write-Host "✓ Exported certificate to: $certFile"

# Export private key as PEM
$privKeyPath = [System.IO.Path]::GetTempFileName()
$password = ConvertTo-SecureString -String "temp" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxFile -Password $password -Force | Out-Null
Write-Host "✓ Exported PFX to: $pfxFile"

# Convert PFX to PEM key
$pfxContent = Get-Content $pfxFile -Raw -Encoding Byte
$pfx = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
$pfx.Import($pfxContent, "temp", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::NoKeyCheck)

# Export key using OpenSSL if available
$opensslPath = (Get-Command openssl -ErrorAction SilentlyContinue).Source
if ($opensslPath) {
    & openssl pkcs12 -in $pfxFile -nocerts -nodes -out $keyFile -password pass:temp 2>&1 | Out-Null
    Write-Host "✓ Exported private key to: $keyFile"
} else {
    Write-Host "⚠️  OpenSSL not found. Using PFX file directly."
    Write-Host "   You may need to install OpenSSL: https://slproweb.com/products/Win32OpenSSL.html"
}

# Cleanup
Remove-Item -Path $certPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $privKeyPath -Force -ErrorAction SilentlyContinue

Write-Host "`n✅ Certificates generated successfully!`n"
Write-Host "Access your app at:"
Write-Host "   https://localhost:9002"
Write-Host "   https://$ipAddress`:9002`n"
