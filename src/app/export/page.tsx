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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Export & Import</h2>

        {/* Export Section */}
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Report</h3>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => exportData('csv')}
              disabled={isExporting}
              className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportData('pdf')}
              disabled={isExporting}
              className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Export PDF
            </button>
          </div>

          <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900">
            <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">Export Information</h3>
            <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
              <li>• CSV format: Date, Type, Transport, Notes</li>
              <li>• PDF format: Formatted table with monthly summaries</li>
              <li>• Use for German tax reporting (Anlage N, Entfernungspauschale)</li>
            </ul>
          </div>
        </div>

        {/* Import Section */}
        <div className="mt-8 space-y-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import CSV</h3>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
            }`}
          >
            <Upload className="mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop a CSV file here or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
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
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} ready to import
                </p>
                <button
                  onClick={clearImport}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>

              <div className="max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Date</th>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Type</th>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Location</th>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Transport</th>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {parsedRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="text-gray-900 dark:text-gray-100">
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
                  <p className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Showing first 50 of {parsedRows.length} rows
                  </p>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : `Import ${parsedRows.length} Row${parsedRows.length !== 1 ? 's' : ''}`}
              </button>
            </>
          )}

          {/* Import result */}
          {importResult && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Import complete: {importResult.imported} new entries, {importResult.updated} updated
              </p>
            </div>
          )}

          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900">
            <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">Import Information</h4>
            <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
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
