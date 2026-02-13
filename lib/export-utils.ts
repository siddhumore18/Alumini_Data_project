/**
 * Export utilities for converting data to CSV and triggering downloads
 */

/**
 * Convert array of objects to CSV format
 */
export function exportToCSV(data: Array<Record<string, any>>, filename: string = 'export.csv'): void {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map((row: Record<string, any>) =>
      headers.map(header => {
        const value = row[header] || ''
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    // Create a link to the file
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Format data for printing
 */
export function formatForPrint(data: Array<Record<string, any>>): string {
  if (!data || data.length === 0) {
    return '<p>No data to print</p>'
  }

  const headers = Object.keys(data[0])

  return `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          ${headers.map(h => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map((row: Record<string, any>) => `
          <tr>
            ${headers.map(h => `<td style="border: 1px solid #ddd; padding: 8px;">${row[h] || ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}
