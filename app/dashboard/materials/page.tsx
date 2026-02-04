'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, FileText, Eye, Edit, Trash, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatFileSize } from '@/lib/utils'
import { AddMaterialDialog } from '@/components/materials/add-material-dialog'
import { EditMaterialDialog } from '@/components/materials/edit-material-dialog'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface Material {
  id: string
  title: string
  title_hi: string | null
  type: string
  language: string
  is_free: boolean
  file_url: string | null
  file_size: number | null
  page_count: number | null
  content_text: string | null
  description_en: string | null
  description_hi: string | null
  created_at: string
}

function StudyMaterialsPageContent() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  // Get sort params from URL or default
  const sortColumn = searchParams.get('sort') || 'created_at'
  const sortOrder = searchParams.get('order') || 'desc'

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    const [col, order] = value.split('-')
    params.set('sort', col)
    params.set('order', order)
    router.push(`${pathname}?${params.toString()}`)
  }

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('content')
        .select('*')
        .order(sortColumn, { ascending: sortOrder === 'asc' })

      if (filterType !== 'all') {
        query = query.eq('type', filterType)
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,title_hi.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setMaterials(data || [])
    } catch (error: any) {
      toast.error('Failed to load materials')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase, filterType, searchQuery, sortColumn, sortOrder])

  useEffect(() => {
    loadMaterials()
  }, [loadMaterials])

  const deleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', materialId)

      if (error) throw error

      toast.success('Material deleted successfully')
      loadMaterials()
    } catch (error: any) {
      toast.error('Failed to delete material')
    }
  }

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { color: any; label: string }> = {
      pdf: { color: 'danger', label: 'PDF' },
      formula: { color: 'info', label: 'Formula' },
      current_affairs: { color: 'success', label: 'Current Affairs' },
    }
    const badge = badges[type] || { color: 'default', label: type }
    return <Badge variant={badge.color}>{badge.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
          <p className="text-gray-600 mt-1">
            Manage PDFs, formulas, and current affairs
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total Materials</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {materials.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">PDFs</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {materials.filter(m => m.type === 'pdf').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Formulas</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {materials.filter(m => m.type === 'formula').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Current Affairs</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {materials.filter(m => m.type === 'current_affairs').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDFs</option>
              <option value="formula">Formulas</option>
              <option value="current_affairs">Current Affairs</option>
            </select>
          </div>

           {/* Sort Dropdown */}
           <div>
            <select
              value={`${sortColumn}-${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No materials found</p>
          <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Material
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getTypeBadge(material.type)}
                  {material.is_free ? (
                    <Badge variant="success">Free</Badge>
                  ) : (
                    <Badge variant="warning">Premium</Badge>
                  )}
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {material.title}
              </h3>
              {material.title_hi && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {material.title_hi}
                </p>
              )}

              {/* Info */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Language:</span>
                  <span className="font-medium">{material.language === 'both' ? 'BILINGUAL' : material.language.toUpperCase()}</span>
                </div>
                {material.file_size && (
                  <div className="flex items-center justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(material.file_size)}</span>
                  </div>
                )}
                {material.page_count && (
                  <div className="flex items-center justify-between">
                    <span>Pages:</span>
                    <span className="font-medium">{material.page_count}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                {material.file_url && (
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-1" />
                    View
                  </Button>
                )}
                <button
                  onClick={() => {
                    setSelectedMaterial(material)
                    setShowEditDialog(true)
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  title="Edit material"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMaterial(material.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete material"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>

              {/* Date */}
              <p className="text-xs text-gray-500 mt-3">
                Added {formatDate(material.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Material Dialog */}
      <AddMaterialDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadMaterials}
      />

      <EditMaterialDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={loadMaterials}
        material={selectedMaterial}
      />
    </div>
  )
}

export default function StudyMaterialsPage() {
  return (
    <Suspense fallback={<div>Loading materials...</div>}>
      <StudyMaterialsPageContent />
    </Suspense>
  )
}
