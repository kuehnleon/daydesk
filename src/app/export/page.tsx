'use client'

import { useState, useRef, useCallback } from 'react'
import { useToast } from '@/components/ui/toast'
import { Navbar } from '@/components/navbar'
import { Upload } from 'lucide-react'
import type { ImportRow } from '@/types'

export default function ExportImport() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const { showToast } = useToast()

  // Import state
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; updated: number } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const exportData = async (exportFormat: 'csv' | 'pdf') => {
    if (!startDate || !endDate) {
      showToast('Please select both start and end dates', 'error')
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch(
        `/api/export?startDate=${startDate}&endDate=${endDate}&format=${exportFormat}`
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `daydesk_${startDate}_${endDate}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('Export completed!', 'success')
      } else {
        showToast('Export failed', 'error')
      }
    } catch {
      showToast('Error exporting data', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const parseCSV = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length < 2) {
      setParseErrors(['CSV file must have a header row and at least one data row'])
      setParsedRows([])
      return
    }

    // Validate header
    const headerLine = lines[0]
    const expectedHeaders = ['Date', 'Type', 'Location', 'Transport', 'Distance (km)', 'Notes']
    const headers = headerLine.split(',').map(h => h.replace(/^"|"$/g, '').trim())

    if (headers.length < 2 || headers[0] !== expectedHeaders[0] || headers[1] !== expectedHeaders[1]) {
      setParseErrors([`Invalid CSV header. Expected: ${expectedHeaders.join(', ')}`])
      setParsedRows([])
      return
    }

    const rows: ImportRow[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Parse quoted CSV values
      const cells: string[] = []
      let current = ''
      let inQuotes = false
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      cells.push(current.trim())

      const date = cells[0] || ''
      const type = cells[1] || ''
      const location = cells[2] || ''
      const transport = cells[3] || ''
      const distance = cells[4] || ''
      const notes = cells[5] || ''

      // Basic validation
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        errors.push(`Row ${i}: Invalid date format "${date}" (expected YYYY-MM-DD)`)
        continue
      }
      if (!['office', 'home', 'off', 'holiday', 'sick'].includes(type)) {
        errors.push(`Row ${i}: Invalid type "${type}" (expected: office, home, off, holiday, sick)`)
        continue
      }

      rows.push({ date, type, location, transport, distance, notes })
    }

    setParseErrors(errors)
    setParsedRows(rows)
    setImportResult(null)
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }, [parseCSV, showToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = async () => {
    if (parsedRows.length === 0) return

    setIsImporting(true)
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      })

      if (response.ok) {
        const data = await response.json()
        setImportResult(data)
        showToast(`Imported ${data.imported} new, updated ${data.updated} existing entries`, 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Import failed', 'error')
      }
    } catch {
      showToast('Error importing data', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  const clearImport = () => {
    setParsedRows([])
    setParseErrors([])
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-6 pb-[calc(1.5rem+var(--sai-bottom))] sm:py-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-text-primary sm:mb-8 sm:text-3xl">Export & Import</h2>

        {/* Export Section */}
        <div className="space-y-6 card p-4 sm:p-8">
          <h3 className="text-lg font-semibold text-text-primary">Export Report</h3>
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent focus:ring-accent"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => exportData('csv')}
              disabled={isExporting}
              className="rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportData('pdf')}
              disabled={isExporting}
              className="rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              Export PDF
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Export Information</h3>
            <ul className="space-y-1 text-xs text-text-secondary">
              <li>• CSV format: Date, Type, Transport, Notes</li>
              <li>• PDF format: Formatted table with monthly summaries</li>
              <li>• Exports may be useful for personal record-keeping (e.g. tax filings)</li>
            </ul>
          </div>
        </div>

        {/* Import Section */}
        <div className="mt-8 space-y-6 card p-4 sm:p-8">
          <h3 className="text-lg font-semibold text-text-primary">Import CSV</h3>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragOver
                ? 'border-accent bg-accent-soft'
                : 'border-border hover:border-text-tertiary'
            }`}
          >
            <Upload className="mb-3 h-10 w-10 text-text-tertiary" />
            <p className="text-sm font-medium text-text-secondary">
              Drop a CSV file here or click to browse
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              Use the same format as the exported CSV
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
              <h4 className="mb-2 text-sm font-semibold text-red-800 dark:text-red-200">
                Parsing Errors ({parseErrors.length})
              </h4>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-red-700 dark:text-red-300">
                {parseErrors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview table */}
          {parsedRows.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} ready to import
                </p>
                <button
                  onClick={clearImport}
                  className="text-sm text-text-tertiary hover:text-text-primary"
                >
                  Clear
                </button>
              </div>

              <div className="max-h-64 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-surface-secondary">
                    <tr>
                      <th className="px-3 py-2 font-medium text-text-secondary">Date</th>
                      <th className="px-3 py-2 font-medium text-text-secondary">Type</th>
                      <th className="px-3 py-2 font-medium text-text-secondary">Location</th>
                      <th className="px-3 py-2 font-medium text-text-secondary">Transport</th>
                      <th className="px-3 py-2 font-medium text-text-secondary">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {parsedRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="text-text-primary">
                        <td className="whitespace-nowrap px-3 py-1.5">{row.date}</td>
                        <td className="px-3 py-1.5">{row.type}</td>
                        <td className="px-3 py-1.5">{row.location || '-'}</td>
                        <td className="px-3 py-1.5">{row.transport || '-'}</td>
                        <td className="max-w-[120px] truncate px-3 py-1.5">{row.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 50 && (
                  <p className="border-t border-border px-3 py-2 text-xs text-text-tertiary">
                    Showing first 50 of {parsedRows.length} rows
                  </p>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : `Import ${parsedRows.length} Row${parsedRows.length !== 1 ? 's' : ''}`}
              </button>
            </>
          )}

          {/* Import result */}
          {importResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-900/20">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Import complete: {importResult.imported} new entries, {importResult.updated} updated
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <h4 className="mb-2 text-sm font-semibold text-text-primary">Import Information</h4>
            <ul className="space-y-1 text-xs text-text-secondary">
              <li>• CSV must have headers: Date, Type, Location, Transport, Distance (km), Notes</li>
              <li>• Dates with existing entries will be updated (overwritten)</li>
              <li>• Location and transport names are matched to your existing entries</li>
              <li>• Export your data first to get a compatible CSV template</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
