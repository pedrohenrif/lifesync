# Builds pwa-192x192.png and pwa-512x512.png from scripts/pwa-icon-source.png
# Scales the full master into the square (fit, centered). Use a source PNG where the
# glyph already fills ~80-85% of the square on pure black — do not inset here or Android
# maskable padding will shrink the logo twice.
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

  $sw = [double]$Src.Width
  $sh = [double]$Src.Height
  $scale = [Math]::Min([double]$S / $sw, [double]$S / $sh)
  $dw = [int][Math]::Round($sw * $scale)
  $dh = [int][Math]::Round($sh * $scale)
  $x = [int](($S - $dw) / 2)
  $y = [int](($S - $dh) / 2)
  $g.DrawImage($Src, $x, $y, $dw, $dh)
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
