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

interface AddQuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddQuestionDialog({ open, onOpenChange, onSuccess }: AddQuestionDialogProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [tests, setTests] = useState<any[]>([])
  const [selectedTestId, setSelectedTestId] = useState<string>('')
  
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

  // Fetch tests when dialog opens
  useEffect(() => {
    if (open) {
      const fetchTests = async () => {
        const { data, error } = await supabase
          .from('tests')
          .select('id, title')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching tests:', error);
        } else {
          setTests(data || []);
        }
      };
      fetchTests();
    }
  }, [open, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Insert Question
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert([formData])
        .select('id')
        .single();

      if (questionError) throw questionError;

      // 2. Link to Test (if selected)
      if (selectedTestId && questionData) {
        // Get the current max order index for this test
        const { data: maxOrderData, error: maxOrderError } = await supabase
            .from('test_questions')
            .select('order_index')
            .eq('test_id', selectedTestId)
            .order('order_index', { ascending: false })
            .limit(1)
            .maybeSingle(); // Use maybeSingle to handle no rows gracefully

        let nextOrderIndex = 1;
        if (!maxOrderError && maxOrderData) {
             nextOrderIndex = maxOrderData.order_index + 1;
        }

        const { error: linkError } = await supabase
          .from('test_questions')
          .insert({
            test_id: selectedTestId,
            question_id: questionData.id,
            order_index: nextOrderIndex
          });

        if (linkError) throw linkError;
      }

      toast.success('Question added successfully!')
      onOpenChange(false)
      onSuccess()
      
      // Reset form
      setFormData({
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
      setSelectedTestId('')
      
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to add question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-3 gap-4">
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

              <div>
                <Label>Link to Test (Optional)</Label>
                <Select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                >
                  <option value="">None (Question Bank only)</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title}
                    </option>
                  ))}
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
              {loading ? 'Adding...' : 'Add Question'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
