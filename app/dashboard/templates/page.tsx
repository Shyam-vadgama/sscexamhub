'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash, Copy, ListTodo, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { AddTemplateDialog } from '@/components/templates/add-template-dialog'
import { EditTemplateDialog } from '@/components/templates/edit-template-dialog'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface StudyTemplate {
  id: string
  title: string
  description: string | null
  tasks: any[]
  is_active: boolean
  created_at: string
}

function TemplatesPageContent() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [templates, setTemplates] = useState<StudyTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<StudyTemplate | null>(null)

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

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('study_templates')
        .select('*')
        .order(sortColumn, { ascending: sortOrder === 'asc' })

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setTemplates(data || [])
    } catch (error: any) {
      toast.error('Failed to load templates')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase, searchQuery, sortColumn, sortOrder])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const { error } = await supabase
        .from('study_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Template deleted successfully')
      loadTemplates()
    } catch (error: any) {
      toast.error('Failed to delete template')
    }
  }

  const duplicateTemplate = async (template: StudyTemplate) => {
    try {
      const { error } = await supabase.from('study_templates').insert({
        title: `${template.title} (Copy)`,
        description: template.description,
        tasks: template.tasks,
        is_active: template.is_active,
      })

      if (error) throw error

      toast.success('Template duplicated')
      loadTemplates()
    } catch (error: any) {
      toast.error('Failed to duplicate template')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage study plan templates for users
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-48">
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

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ListTodo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No templates found</p>
          <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <Badge variant={template.is_active ? 'success' : 'default'}>
                  {template.is_active ? 'Active' : 'Draft'}
                </Badge>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => duplicateTemplate(template)}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setShowEditDialog(true)
                    }}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => deleteTemplate(template.id)}
                    title="Delete"
                  >
                    <Trash className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                {template.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                {template.description || 'No description provided'}
              </p>

              <div className="flex items-center text-sm text-gray-500 pt-4 border-t mt-auto">
                <ListTodo className="w-4 h-4 mr-2" />
                <span>{Array.isArray(template.tasks) ? template.tasks.length : 0} Tasks</span>
                <span className="mx-2">•</span>
                <span>{formatDate(template.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddTemplateDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadTemplates}
      />

      <EditTemplateDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={loadTemplates}
        template={selectedTemplate}
      />
    </div>
  )
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div>Loading templates...</div>}>
      <TemplatesPageContent />
    </Suspense>
  )
}