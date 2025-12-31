# PowerShell script to download Poppins fonts

# Create fonts directory if it doesn't exist
if (-Not (Test-Path -Path ".\assets\fonts")) {
    New-Item -ItemType Directory -Path ".\assets\fonts" -Force
    Write-Host "Created assets/fonts directory"
}

# Font URLs
$fonts = @(
    @{
        Name = "Poppins-Regular.ttf"
        URL = "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf"
    },
    @{
        Name = "Poppins-Medium.ttf"
        URL = "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Medium.ttf"
    },
    @{
        Name = "Poppins-SemiBold.ttf"
        URL = "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-SemiBold.ttf"
    },
    @{
        Name = "Poppins-Bold.ttf"
        URL = "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf"
    },
    @{
        Name = "Poppins-Italic.ttf"
        URL = "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Italic.ttf"
    }
)

# Download each font
foreach ($font in $fonts) {
    $outputPath = ".\assets\fonts\$($font.Name)"
    Write-Host "Downloading $($font.Name)..."
    try {
        Invoke-WebRequest -Uri $font.URL -OutFile $outputPath
        Write-Host "Downloaded $($font.Name) successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to download $($font.Name): $_" -ForegroundColor Red
    }
}

Write-Host "Font download complete. All Poppins fonts have been downloaded to assets/fonts directory."
