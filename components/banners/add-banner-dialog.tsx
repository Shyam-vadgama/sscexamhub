'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { Loader2, Upload } from 'lucide-react'

interface AddBannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddBannerDialog({ open, onOpenChange, onSuccess }: AddBannerDialogProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    target_type: 'none',
    target_value: '',
    display_order: 0,
  })

  const handleUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `banner-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { error: uploadError, data } = await supabase.storage
      .from('content')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError)
      throw new Error(uploadError.message)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('content')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) {
      toast.error('Please select an image')
      return
    }

    setLoading(true)
    try {
      const imageUrl = await handleUpload(imageFile)

      const { error } = await supabase.from('app_banners').insert({
        ...formData,
        image_url: imageUrl,
        is_active: true
      })

      if (error) throw error

      toast.success('Banner added successfully')
      onSuccess()
      onOpenChange(false)
      // Reset form
      setFormData({ title: '', target_type: 'none', target_value: '', display_order: 0 })
      setImageFile(null)
    } catch (error: any) {
      console.error('Full Error Object:', error)
      const msg = error.message || 'Failed to add banner'
      toast.error(msg)
      
      if (msg.includes('mime type') || msg.includes('not supported')) {
        toast('Tip: Check if your Supabase "content" bucket allows image/jpeg in settings.', {
          icon: '💡',
          duration: 6000
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add App Banner</DialogTitle>
            <DialogDescription>
              Create a new banner for the home screen slider.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Banner Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. CGL Mock Test Live"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Banner Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="target_type">Action Type</Label>
                <select
                  id="target_type"
                  className="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                  value={formData.target_type}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                >
                  <option value="none">None</option>
                  <option value="link">URL Link</option>
                  <option value="test">Specific Test</option>
                  <option value="material">Study Material</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
            </div>
            {formData.target_type !== 'none' && (
              <div className="grid gap-2">
                <Label htmlFor="target_value">Target Value (URL or ID)</Label>
                <Input
                  id="target_value"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="https://... or UUID"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Banner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
