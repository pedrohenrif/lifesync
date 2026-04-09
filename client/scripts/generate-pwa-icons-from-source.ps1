# Builds pwa-192x192.png and pwa-512x512.png from scripts/pwa-icon-source.png
# Stretches the source to fill the entire square on #000000. No inset — Android
# maskable padding is the only crop; your source should already use the full canvas.
param(
  [string] $SourceFile = ""
)

Add-Type -AssemblyName System.Drawing

$public = (Resolve-Path (Join-Path $PSScriptRoot "..\public")).Path
$defaultSource = Join-Path $PSScriptRoot "pwa-icon-source.png"
if (-not $SourceFile) {
  $SourceFile = $defaultSource
}
if (-not (Test-Path -LiteralPath $SourceFile)) {
  Write-Error "Source not found: $SourceFile - add your master PNG as client/scripts/pwa-icon-source.png"
  exit 1
}

function Write-PwaSquare {
  param(
    [System.Drawing.Image] $Src,
    [int] $S,
    [string] $OutPath
  )
  $bmp = New-Object System.Drawing.Bitmap $S, $S
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $bg = [System.Drawing.Color]::FromArgb(255, 0, 0, 0)
  $g.Clear($bg)
  $g.DrawImage($Src, 0, 0, [float]$S, [float]$S)
  $g.Dispose()
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $SourceFile).Path)
try {
  foreach ($size in @(192, 512)) {
    $out = Join-Path $public "pwa-${size}x${size}.png"
    Write-PwaSquare -Src $srcImg -S $size -OutPath $out
    $len = (Get-Item -LiteralPath $out).Length
    Write-Host ('Wrote {0} ({1} bytes)' -f $out, $len)
  }
}
finally {
  $srcImg.Dispose()
}
