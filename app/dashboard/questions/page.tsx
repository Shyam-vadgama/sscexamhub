'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Download, Eye, Edit, Trash, Upload } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AddQuestionDialog } from '@/components/questions/add-question-dialog'
import { EditQuestionDialog } from '@/components/questions/edit-question-dialog'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  subject: string
  difficulty: string
  explanation: string
  created_at: string
}

export default function QuestionsPage() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const pageSize = 20

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

      if (filterSubject !== 'all') {
        query = query.eq('subject', filterSubject)
      }

      if (filterDifficulty !== 'all') {
        query = query.eq('difficulty', filterDifficulty)
      }

      if (searchQuery) {
        query = query.ilike('question_text', `%${searchQuery}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      setQuestions(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error: any) {
      toast.error('Failed to load questions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase, currentPage, filterSubject, filterDifficulty, searchQuery, pageSize])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      toast.success('Question deleted successfully')
      loadQuestions()
    } catch (error: any) {
      toast.error('Failed to delete question')
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      easy: 'success',
      medium: 'warning',
      hard: 'danger',
    }
    return <Badge variant={variants[difficulty] || 'default'}>{difficulty.toUpperCase()}</Badge>
  }

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Quantitative Aptitude': 'bg-blue-100 text-blue-700',
      'General Awareness': 'bg-green-100 text-green-700',
      'English': 'bg-purple-100 text-purple-700',
      'Reasoning': 'bg-orange-100 text-orange-700',
    }
    return colors[subject] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600 mt-1">
            Manage all questions for tests
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/questions/upload">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
          </Link>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total Questions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '-' : questions.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Easy</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {questions.filter(q => q.difficulty === 'easy').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Medium</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {questions.filter(q => q.difficulty === 'medium').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Hard</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {questions.filter(q => q.difficulty === 'hard').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
            >
              <option value="all">All Subjects</option>
              <option value="Quantitative Aptitude">Quantitative Aptitude</option>
              <option value="General Awareness">General Awareness</option>
              <option value="English">English</option>
              <option value="Reasoning">Reasoning</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
            >
              <option value="all">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Refresh */}
          <Button variant="outline" onClick={loadQuestions}>
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No questions found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {questions.map((question, index) => (
                <div key={question.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 w-full">
                      {/* Question Number & Subject */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-gray-500">
                          Q{(currentPage - 1) * pageSize + index + 1}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubjectColor(question.subject)}`}>
                          {question.subject}
                        </span>
                        {getDifficultyBadge(question.difficulty)}
                      </div>

                      {/* Question Text */}
                      <p className="text-gray-900 font-medium mb-3">
                        {question.question_text}
                      </p>

                      {/* Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        {['a', 'b', 'c', 'd'].map((opt) => {
                          const optionKey = `option_${opt}` as keyof Question
                          const isCorrect = question.correct_answer === opt
                          return (
                            <div
                              key={opt}
                              className={`px-3 py-2 rounded-lg text-sm ${
                                isCorrect
                                  ? 'bg-green-50 border-2 border-green-500 text-green-900 font-medium'
                                  : 'bg-gray-50 border border-gray-200 text-gray-700'
                              }`}
                            >
                              <span className="font-semibold">{opt.toUpperCase()}.</span>{' '}
                              {question[optionKey] as string}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 self-end sm:self-start">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuestion(question)
                          setShowEditDialog(true)
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="Edit question"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete question"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* Add Question Dialog */}
      <AddQuestionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadQuestions}
      />

      {selectedQuestion && (
        <EditQuestionDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={loadQuestions}
          question={selectedQuestion}
        />
      )}
    </div>
  )
}
