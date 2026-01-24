'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import toast from 'react-hot-toast'

interface EditQuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  question: any
}

export function EditQuestionDialog({ open, onOpenChange, onSuccess, question }: EditQuestionDialogProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a',
    subject: 'Quantitative Aptitude',
    difficulty: 'medium',
    explanation: '',
    question_text_hi: '',
  })

  // Load question data when dialog opens
  useEffect(() => {
    if (open && question) {
      setFormData({
        question_text: question.question_text || '',
        option_a: question.option_a || '',
        option_b: question.option_b || '',
        option_c: question.option_c || '',
        option_d: question.option_d || '',
        correct_answer: question.correct_answer || 'a',
        subject: question.subject || 'Quantitative Aptitude',
        difficulty: question.difficulty || 'medium',
        explanation: question.explanation || '',
        question_text_hi: question.question_text_hi || '',
      })
    }
  }, [open, question])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('questions')
        .update(formData)
        .eq('id', question.id)

      if (error) throw error

      toast.success('Question updated successfully!')
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to update question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject</Label>
                <Select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                >
                  <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                  <option value="General Awareness">General Awareness</option>
                  <option value="English">English</option>
                  <option value="Reasoning">Reasoning</option>
                </Select>
              </div>

              <div>
                <Label>Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  required
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <div>
                <Label>Question (English) *</Label>
                <Textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter question in English"
                  required
                  rows={3}
                />
              </div>

              <div>
                <Label>Question (Hindi)</Label>
                <Textarea
                  value={formData.question_text_hi}
                  onChange={(e) => setFormData({ ...formData, question_text_hi: e.target.value })}
                  placeholder="प्रश्न हिंदी में दर्ज करें"
                  rows={3}
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Options</Label>
              
              {['a', 'b', 'c', 'd'].map((opt) => (
                <div key={opt}>
                  <Label>Option {opt.toUpperCase()} *</Label>
                  <Input
                    value={formData[`option_${opt}` as keyof typeof formData] as string}
                    onChange={(e) => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                    placeholder={`Option ${opt.toUpperCase()}`}
                    required
                  />
                </div>
              ))}
            </div>

            {/* Correct Answer */}
            <div>
              <Label>Correct Answer *</Label>
              <Select
                value={formData.correct_answer}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                required
              >
                <option value="a">Option A</option>
                <option value="b">Option B</option>
                <option value="c">Option C</option>
                <option value="d">Option D</option>
              </Select>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Enter explanation"
                  rows={3}
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
