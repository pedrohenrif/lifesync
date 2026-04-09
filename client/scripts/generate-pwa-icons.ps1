Add-Type -AssemblyName System.Drawing
$public = (Resolve-Path (Join-Path $PSScriptRoot "..\public")).Path
foreach ($size in @(192, 512)) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(255, 9, 9, 11))
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
  $m = [Math]::Max(1, [int]($size * 0.16))
  $g.FillEllipse($brush, $m, $m, $size - 2 * $m, $size - 2 * $m)
  $brush.Dispose()
  $out = Join-Path $public "pwa-${size}x${size}.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Host "Wrote $out"
}
