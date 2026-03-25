'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/toast'
import { Navbar } from '@/components/navbar'

export default function Export() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const { showToast } = useToast()

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
        a.download = `worklog_${startDate}_${endDate}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('Export completed!', 'success')
      } else {
        showToast('Export failed', 'error')
      }
    } catch (error) {
      showToast('Error exporting data', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Export Report</h2>

        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
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
      </main>
    </div>
  )
}
