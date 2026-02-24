'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import toast from 'react-hot-toast'
import { logAction } from '@/lib/logger'

interface User {
  id: string
  phone: string
  email: string | null
  name: string | null
  plan: string
  exam_type: string | null
  coins: number
  streak_days: number
}

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: User | null
}

export function EditUserDialog({ open, onOpenChange, onSuccess, user }: EditUserDialogProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'free',
    exam_type: '',
    coins: 0,
    streak_days: 0,
  })

  useEffect(() => {
    if (open && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        plan: user.plan || 'free',
        exam_type: user.exam_type || '',
        coins: user.coins || 0,
        streak_days: user.streak_days || 0,
      })
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name || null,
          email: formData.email || null,
          phone: formData.phone,
          plan: formData.plan,
          exam_type: formData.exam_type || null,
          coins: formData.coins,
          streak_days: formData.streak_days,
        })
        .eq('id', user.id)

      if (error) throw error

      await logAction('UPDATE_USER', 'users', user.id, { 
        updates: formData,
        updated_by: 'admin' 
      })

      toast.success('User updated successfully!')
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Edit User Info</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter user name"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>

            <div>
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan *</Label>
                <Select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  required
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </Select>
              </div>

              <div>
                <Label>Exam Type</Label>
                <Input
                  value={formData.exam_type}
                  onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                  placeholder="e.g. SSC CGL"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coins</Label>
                <Input
                  type="number"
                  value={formData.coins}
                  onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div>
                <Label>Streak Days</Label>
                <Input
                  type="number"
                  value={formData.streak_days}
                  onChange={(e) => setFormData({ ...formData, streak_days: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
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
