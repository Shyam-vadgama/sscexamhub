'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, Trash, ExternalLink, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface NewsItem {
  id: string
  title: string
  link: string
  description: string | null
  pub_date: string | null
  source: string | null
  created_at: string
}

function NewsPageContent() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20

  // Get sort params from URL or default
  const sortColumn = searchParams.get('sort') || 'pub_date'
  const sortOrder = searchParams.get('order') || 'desc'

  const handleSort = (column: string) => {
    const newOrder = column === sortColumn && sortOrder === 'asc' ? 'desc' : 'asc'
    const params = new URLSearchParams(searchParams)
    params.set('sort', column)
    params.set('order', newOrder)
    router.push(`${pathname}?${params.toString()}`)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1 text-gray-900" /> : 
      <ArrowDown className="w-4 h-4 ml-1 text-gray-900" />
  }

  const loadNews = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('news')
        .select('*', { count: 'exact' })
        .order(sortColumn, { ascending: sortOrder === 'asc' })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      setNews(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error: any) {
      toast.error('Failed to load news')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase, currentPage, searchQuery, pageSize, sortColumn, sortOrder])

  useEffect(() => {
    loadNews()
  }, [loadNews])

  const deleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) return

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('News deleted successfully')
      loadNews()
    } catch (error: any) {
      toast.error('Failed to delete news')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Feed</h1>
          <p className="text-gray-600 mt-1">
            Manage education news fetched from external sources
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search news titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Refresh Button */}
          <Button variant="outline" onClick={loadNews}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* News Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading news...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No news found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center">
                        Title
                        <SortIcon column="title" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('source')}
                    >
                      <div className="flex items-center">
                        Source
                        <SortIcon column="source" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('pub_date')}
                    >
                      <div className="flex items-center">
                        Published
                        <SortIcon column="pub_date" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {news.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-2" title={item.title}>
                            {item.title}
                          </p>
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center mt-1"
                          >
                            View Original <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          {item.source || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.pub_date ? formatDate(item.pub_date) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => deleteNews(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete news"
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

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div>Loading news...</div>}>
      <NewsPageContent />
    </Suspense>
  )
}
