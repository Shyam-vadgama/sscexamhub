'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Question {
  id: string
  question_text: string
  question_text_hi: string | null
  subject: string
  difficulty: string
  topic: string | null
}

interface AddQuestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  testId: string
  existingQuestionIds: string[]
}

export function AddQuestionsDialog({ open, onOpenChange, onSuccess, testId, existingQuestionIds }: AddQuestionsDialogProps) {
  const supabase = createClient()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('questions')
        .select('id, question_text, question_text_hi, subject, difficulty, topic')
        .limit(50) // Limit to avoid performance issues, maybe implement pagination later

      if (selectedSubject !== 'all') {
        query = query.eq('subject', selectedSubject)
      }

      if (searchQuery) {
        query = query.or(`question_text.ilike.%${searchQuery}%,question_text_hi.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter out questions that are already in the test
      const availableQuestions = (data || []).filter(q => !existingQuestionIds.includes(q.id))
      setQuestions(availableQuestions)
    } catch (error) {
      console.error('Error loading questions:', error)
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [supabase, selectedSubject, searchQuery, existingQuestionIds])

  useEffect(() => {
    if (open) {
      loadQuestions()
      setSelectedQuestions(new Set())
    }
  }, [open, loadQuestions])

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions)
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId)
    } else {
      newSelected.add(questionId)
    }
    setSelectedQuestions(newSelected)
  }

  const handleAddQuestions = async () => {
    if (selectedQuestions.size === 0) return

    setSaving(true)
    try {
      const questionsToAdd = Array.from(selectedQuestions).map((questionId, index) => ({
        test_id: testId,
        question_id: questionId,
        order: existingQuestionIds.length + index + 1 // Simple ordering strategy
      }))

      const { error } = await supabase
        .from('test_questions')
        .insert(questionsToAdd)

      if (error) throw error

      toast.success(`Added ${selectedQuestions.size} questions to test`)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error adding questions:', error)
      toast.error('Failed to add questions')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Questions to Test</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex items-center space-x-4 py-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
          >
            <option value="all">All Subjects</option>
            <option value="math">Mathematics</option>
            <option value="reasoning">Reasoning</option>
            <option value="english">English</option>
            <option value="ga">General Awareness</option>
          </select>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto min-h-0 border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>No matching questions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedQuestions.has(question.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggleQuestion(question.id)}
                >
                  <div className={`
                    w-5 h-5 rounded border flex items-center justify-center flex-none mt-1
                    ${selectedQuestions.has(question.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}
                  `}>
                    {selectedQuestions.has(question.id) && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {question.question_text}
                    </p>
                    {question.question_text_hi && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {question.question_text_hi}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="info" className="text-xs">
                        {question.subject}
                      </Badge>
                      <Badge variant="warning" className="text-xs">
                        {question.difficulty}
                      </Badge>
                      {question.topic && (
                        <span className="text-xs text-gray-500">
                          {question.topic}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {selectedQuestions.size} questions selected
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddQuestions} disabled={saving || selectedQuestions.size === 0}>
                {saving ? 'Adding...' : 'Add Selected Questions'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
