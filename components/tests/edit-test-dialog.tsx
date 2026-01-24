'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import toast from 'react-hot-toast'

interface EditTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  test: any
}

export function EditTestDialog({ open, onOpenChange, onSuccess, test }: EditTestDialogProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    title_hi: '',
    description: '',
    test_type: 'mock',
    duration_minutes: 60,
    total_marks: 200,
    passing_marks: 70,
    difficulty: 'medium',
    is_free: false,
    slug: '',
  })

  useEffect(() => {
    if (open && test) {
      setFormData({
        title: test.title || '',
        title_hi: test.title_hi || '',
        description: test.description || '',
        test_type: test.test_type || 'mock',
        duration_minutes: test.duration_minutes || 60,
        total_marks: test.total_marks || 200,
        passing_marks: test.passing_marks || 70,
        difficulty: test.difficulty || 'medium',
        is_free: test.is_free || false,
        slug: test.slug || '',
      })
    }
  }, [open, test])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // If slug is empty or different, maybe update it? 
      // For now, let's keep slug logic simple: if title changes, slug doesn't auto-update to avoid breaking URLs
      // unless we explicitly want it to.
      
      const { error } = await supabase
        .from('tests')
        .update({
          title: formData.title,
          title_hi: formData.title_hi,
          description: formData.description,
          test_type: formData.test_type,
          duration_minutes: formData.duration_minutes,
          total_marks: formData.total_marks,
          passing_marks: formData.passing_marks,
          difficulty: formData.difficulty,
          is_free: formData.is_free,
          // slug: formData.slug // Optionally allow slug updates
        })
        .eq('id', test.id)

      if (error) throw error

      toast.success('Test updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating test:', error)
      toast.error(error.message || 'Failed to update test')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Edit Test</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Title (English)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="title_hi">Title (Hindi)</Label>
              <Input
                id="title_hi"
                value={formData.title_hi}
                onChange={(e) => setFormData({ ...formData, title_hi: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test_type">Test Type</Label>
                <select
                  id="test_type"
                  value={formData.test_type}
                  onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                >
                  <option value="mock">Mock Test</option>
                  <option value="sectional">Sectional Test</option>
                  <option value="pyq">Previous Year Question</option>
                  <option value="daily_practice">Daily Practice</option>
                </select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">Duration (mins)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="marks">Total Marks</Label>
                <Input
                  id="marks"
                  type="number"
                  min="1"
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="passing">Passing Marks</Label>
                <Input
                  id="passing"
                  type="number"
                  min="1"
                  value={formData.passing_marks}
                  onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="is_free"
                checked={formData.is_free}
                onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <Label htmlFor="is_free">Free Test (No Subscription Required)</Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
