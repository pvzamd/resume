param([Parameter(Mandatory = $true)][string]$Files)

$paths = $Files -split ';' | Where-Object { $_ -ne '' }
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    foreach ($p in $paths) {
        $pdf = [System.IO.Path]::ChangeExtension($p, '.pdf')
        $doc = $word.Documents.Open($p, $false, $true)
        # 17 = wdFormatPDF
        $doc.SaveAs([ref]$pdf, [ref]17)
        $pages = $doc.ComputeStatistics(2)   # wdStatisticPages
        $doc.Close($false)
        $name = [System.IO.Path]::GetFileName($pdf)
        if ($pages -gt 1) { "  $name  ($pages pages - WARNING, expected 1)" }
        else { "  $name" }
    }
}
finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
