'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Upload, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface EditMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  material: any
}

export function EditMaterialDialog({ open, onOpenChange, onSuccess, material }: EditMaterialDialogProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    title_hi: '',
    type: 'pdf',
    language: 'bilingual',
    is_free: true,
    content_text: '',
    description_en: '',
    description_hi: '',
    page_count: null as number | null,
    file_url: null as string | null,
  })

  useEffect(() => {
    if (open && material) {
      setFormData({
        title: material.title || '',
        title_hi: material.title_hi || '',
        type: material.type || 'pdf',
        language: material.language || 'bilingual',
        is_free: material.is_free || false,
        content_text: material.content_text || '',
        description_en: material.description_en || '',
        description_hi: material.description_hi || '',
        page_count: material.page_count || null,
        file_url: material.file_url || null,
      })
    }
  }, [open, material])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (formData.type === 'pdf' && file.type !== 'application/pdf') {
        toast.error('Please select a PDF file')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.title) {
        toast.error('Title is required')
        setLoading(false)
        return
      }

      if (formData.type !== 'pdf' && !formData.content_text) {
        toast.error('Content text is required')
        setLoading(false)
        return
      }

      let file_url = formData.file_url
      let file_size = material.file_size // keep existing size by default

      // Handle new file upload if selected
      if (formData.type === 'pdf' && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('content')
          .upload(filePath, selectedFile, { upsert: false })

        if (uploadError) {
          console.warn('Upload error:', uploadError)
          toast.error(`Upload failed: ${uploadError.message}`)
          setLoading(false)
          return
        } else {
          const { data: urlData } = supabase.storage
            .from('content')
            .getPublicUrl(filePath)
          
          file_url = urlData.publicUrl
          file_size = selectedFile.size
        }
      }

      const { error } = await supabase
        .from('content')
        .update({
          title: formData.title,
          title_hi: formData.title_hi || null,
          type: formData.type,
          language: formData.language,
          is_free: formData.is_free,
          file_url,
          file_size, // update size if new file
          page_count: formData.page_count,
          content_text: formData.content_text || null,
          description_en: formData.description_en || null,
          description_hi: formData.description_hi || null,
        })
        .eq('id', material.id)

      if (error) throw error

      toast.success('Material updated successfully!')
      onOpenChange(false)
      onSuccess()
      setSelectedFile(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update material')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Edit Study Material</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="pdf">PDF Document</option>
                  <option value="formula">Formula Sheet</option>
                  <option value="current_affairs">Current Affairs</option>
                </Select>
              </div>

              <div>
                <Label>Language *</Label>
                <Select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  required
                >
                  <option value="en">English Only</option>
                  <option value="hi">Hindi Only</option>
                  <option value="bilingual">Bilingual</option>
                </Select>
              </div>

              <div>
                <Label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Free Access</span>
                </Label>
              </div>
            </div>

            {/* Title Fields */}
            <div className="space-y-4">
              <div>
                <Label>Title (English) *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title in English"
                  required
                />
              </div>

              {formData.language !== 'en' && (
                <div>
                  <Label>Title (Hindi)</Label>
                  <Input
                    value={formData.title_hi}
                    onChange={(e) => setFormData({ ...formData, title_hi: e.target.value })}
                    placeholder="शीर्षक हिंदी में दर्ज करें"
                  />
                </div>
              )}
            </div>

            {/* File Upload for PDFs */}
            {formData.type === 'pdf' && (
              <div className="space-y-4">
                <div>
                  <Label>Update PDF File (Optional)</Label>
                  <div className="mt-2">
                    <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 cursor-pointer">
                      <div className="space-y-2 text-center">
                        {selectedFile ? (
                          <>
                            <FileText className="w-8 h-8 mx-auto text-blue-600" />
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-blue-600">{selectedFile.name}</span>
                              <p className="text-xs text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto text-gray-400" />
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-blue-600">Click to upload new file</span>
                              <span className="text-gray-500"> or keep existing</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {formData.file_url ? 'Current file exists' : 'PDF files only'}
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Page Count</Label>
                  <Input
                    type="number"
                    value={formData.page_count || ''}
                    onChange={(e) => setFormData({ ...formData, page_count: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Enter number of pages"
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Content Text for Formulas and Current Affairs */}
            {formData.type !== 'pdf' && (
              <div>
                <Label>Content *</Label>
                <Textarea
                  value={formData.content_text}
                  onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                  placeholder={
                    formData.type === 'formula'
                      ? 'Enter formula content (supports markdown)'
                      : 'Enter current affairs content'
                  }
                  required
                  rows={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports markdown formatting
                </p>
              </div>
            )}

            {/* Description Fields */}
            <div className="space-y-4">
              <div>
                <Label>Description (English)</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  placeholder="Enter brief description in English"
                  rows={3}
                />
              </div>

              {formData.language !== 'en' && (
                <div>
                  <Label>Description (Hindi)</Label>
                  <Textarea
                    value={formData.description_hi}
                    onChange={(e) => setFormData({ ...formData, description_hi: e.target.value })}
                    placeholder="संक्षिप्त विवरण हिंदी में दर्ज करें"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
