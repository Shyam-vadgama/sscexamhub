'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { 
  Database, 
  Search, 
  Download, 
  RefreshCw, 
  Trash, 
  ChevronLeft, 
  ChevronRight,
  Table as TableIcon,
  Eye,
  Edit
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatDateTime } from '@/lib/utils'

const TABLES = [
  { name: 'users', label: 'Users' },
  { name: 'tests', label: 'Tests' },
  { name: 'questions', label: 'Questions' },
  { name: 'content', label: 'Content' },
  { name: 'test_attempts', label: 'Test Attempts' },
  { name: 'payments', label: 'Payments' },
]

export default function DatabasePage() {
  const supabase = createClient()
  const [selectedTable, setSelectedTable] = useState('users')
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(50)
  const [viewRecord, setViewRecord] = useState<any>(null)

  const loadTableData = useCallback(async () => {
    setLoading(true)
    try {
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1

      // Get data and count
      const { data: tableData, error, count } = await supabase
        .from(selectedTable)
        .select('*', { count: 'exact' })
        .range(start, end)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTotalCount(count || 0)
      setData(tableData || [])

      // Extract columns from first record
      if (tableData && tableData.length > 0) {
        setColumns(Object.keys(tableData[0]))
      } else {
        setColumns([])
      }
    } catch (error: any) {
      toast.error(`Failed to load ${selectedTable} data`)
      console.error(error)
      setData([])
      setColumns([])
    } finally {
      setLoading(false)
    }
  }, [supabase, selectedTable, page, pageSize])

  useEffect(() => {
    loadTableData()
  }, [loadTableData])

  const searchTable = async () => {
    if (!searchQuery.trim()) {
      loadTableData()
      return
    }

    setLoading(true)
    const sanitizedQuery = searchQuery.replace(/,/g, '')
    
    try {
      // Build search query based on table
      let query = supabase.from(selectedTable).select('*')

      // Add search conditions based on common text fields
      if (selectedTable === 'users') {
        query = query.or(`name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
      } else if (selectedTable === 'tests') {
        query = query.or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
      } else if (selectedTable === 'questions') {
        query = query.or(`question_text.ilike.%${sanitizedQuery}%,question_text_hi.ilike.%${sanitizedQuery}%`)
      } else if (selectedTable === 'content') {
        query = query.or(`title.ilike.%${sanitizedQuery}%,title_hi.ilike.%${sanitizedQuery}%`)
      }

      const { data: searchData, error } = await query

      if (error) throw error

      setData(searchData || [])
      setTotalCount(searchData?.length || 0)
    } catch (error: any) {
      toast.error('Search failed')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const deleteRecord = async (record: any) => {
    if (!confirm(`Are you sure you want to delete this ${selectedTable} record?`)) return

    try {
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', record.id)

      if (error) throw error

      toast.success('Record deleted successfully')
      loadTableData()
    } catch (error: any) {
      toast.error('Failed to delete record')
      console.error(error)
    }
  }

  const exportTable = async () => {
    try {
      // Get all data
      const { data: allData, error } = await supabase
        .from(selectedTable)
        .select('*')

      if (error) throw error

      if (!allData || allData.length === 0) {
        toast.error('No data to export')
        return
      }

      // Convert to CSV
      const headers = Object.keys(allData[0])
      const csvRows = [
        headers.join(','),
        ...allData.map(row => 
          headers.map(header => {
            const value = row[header]
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedTable}-${Date.now()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success('Table exported successfully')
    } catch (error: any) {
      toast.error('Failed to export table')
      console.error(error)
    }
  }

  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value)
    if (column.includes('created_at') || column.includes('updated_at')) {
      return formatDateTime(value)
    }
    if (column.includes('date')) {
      return formatDate(value)
    }
    return String(value)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Viewer</h1>
          <p className="text-gray-600 mt-1">
            View and manage database tables
          </p>
        </div>
        <Button onClick={exportTable} className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalCount.toLocaleString()}
                </p>
              </div>
              <TableIcon className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Page</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {page} / {totalPages || 1}
                </p>
              </div>
              <Database className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Columns</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {columns.length}
                </p>
              </div>
              <TableIcon className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2">Table</Label>
              <Select
                value={selectedTable}
                onChange={(e) => {
                  setSelectedTable(e.target.value)
                  setPage(1)
                  setSearchQuery('')
                }}
              >
                {TABLES.map(table => (
                  <option key={table.name} value={table.name}>
                    {table.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-2">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchTable()}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex space-x-2 items-end">
              <Button onClick={searchTable} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={loadTableData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>{TABLES.find(t => t.name === selectedTable)?.label || selectedTable}</CardTitle>
          <CardDescription>
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} records
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Database className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {columns.slice(0, 8).map((column) => (
                      <th
                        key={column}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.replace(/_/g, ' ')}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((record, index) => (
                    <tr key={record.id || index} className="hover:bg-gray-50">
                      {columns.slice(0, 8).map((column) => (
                        <td
                          key={column}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          <div className="max-w-xs truncate" title={formatValue(record[column], column)}>
                            {formatValue(record[column], column)}
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setViewRecord(record)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRecord(record)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete record"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Record Modal */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Record Details</h2>
                <button
                  onClick={() => setViewRecord(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(viewRecord).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-4">
                    <div className="font-medium text-gray-700">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </div>
                    <div className="col-span-2 text-gray-900 break-words">
                      {formatValue(value, key)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setViewRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium text-gray-700 ${className}`}>{children}</label>
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
