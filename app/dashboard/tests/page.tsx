'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

// ... existing code ...

export default function TestsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)

  useEffect(() => {
    loadTests()
  }, [filterType, searchQuery])

  const loadTests = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterType !== 'all') {
        query = query.eq('test_type', filterType)
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,title_hi.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setTests(data || [])
    } catch (error: any) {
      toast.error('Failed to load tests')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return

    try {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', testId)

      if (error) throw error

      toast.success('Test deleted successfully')
      loadTests()
    } catch (error: any) {
      toast.error('Failed to delete test')
    }
  }

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      mock: { color: 'bg-blue-100 text-blue-700', label: 'Mock Test' },
      sectional: { color: 'bg-purple-100 text-purple-700', label: 'Sectional' },
      pyq: { color: 'bg-green-100 text-green-700', label: 'PYQ' },
      daily_practice: { color: 'bg-orange-100 text-orange-700', label: 'Daily' },
    }
    const badge = badges[type] || { color: 'bg-gray-100 text-gray-700', label: type }
    return <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
      {badge.label}
    </span>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tests</h1>
          <p className="text-gray-600 mt-1">
            Manage all tests and mock exams
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="mock">Mock Tests</option>
              <option value="sectional">Sectional</option>
              <option value="pyq">Previous Year</option>
              <option value="daily_practice">Daily Practice</option>
            </select>
          </div>

          {/* Refresh */}
          <Button variant="outline" onClick={loadTests} className="w-full">
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No tests found</p>
          <Button className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Test
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Test Header */}
              <div className="flex items-start justify-between mb-4">
                {getTypeBadge(test.test_type)}
                {test.is_live && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>

              {/* Test Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {test.title}
              </h3>
              {test.title_hi && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {test.title_hi}
                </p>
              )}

              {/* Test Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {test.duration_minutes} minutes • {test.total_marks} marks
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {test.total_attempts} attempts
                </div>
              </div>

              {/* Free/Premium Badge */}
              <div className="mb-4">
                {test.is_free ? (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    Free
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                    Premium
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/tests/${test.id}`)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedTest(test)
                    setShowEditDialog(true)
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <button
                  onClick={() => deleteTest(test.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete test"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>

              {/* Created Date */}
              <p className="text-xs text-gray-500 mt-3">
                Created {formatDate(test.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
      {/* Create Test Dialog */}
      <CreateTestDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
        onSuccess={loadTests} 
      />
      
      {selectedTest && (
        <EditTestDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={loadTests}
          test={selectedTest}
        />
      )}
    </div>
  )
}
