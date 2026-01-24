'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Clock, Award, Users, Plus, Trash, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Test {
  id: string
  title: string
  title_hi: string | null
  description: string | null
  test_type: string
  duration_minutes: number
  total_marks: number
  passing_marks: number
  difficulty: string
  is_free: boolean
  created_at: string
}

interface Question {
  id: string
  question_text: string
  question_text_hi: string | null
  subject: string
  difficulty: string
  topic: string | null
}

interface TestQuestion {
  test_id: string
  question_id: string
  order: number
  question: Question
}

import { AddQuestionsDialog } from '@/components/tests/add-questions-dialog'

export default function TestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddQuestions, setShowAddQuestions] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadTestDetails()
    }
  }, [params.id])

  const loadTestDetails = async () => {
    try {
      setLoading(true)
      
      // Load Test Info
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', params.id)
        .single()

      if (testError) throw testError
      setTest(testData)

      // Load Questions for this Test
      // Note: This relies on your junction table `test_questions` having a relation to `questions`
      const { data: questionsData, error: questionsError } = await supabase
        .from('test_questions')
        .select(`
          test_id,
          question_id,
          order,
          question:questions (
            id,
            question_text,
            question_text_hi,
            subject,
            difficulty,
            topic
          )
        `)
        .eq('test_id', params.id)
        .order('order', { ascending: true })

      if (questionsError) throw questionsError
      
      // Transform data to match interface if needed
      setTestQuestions(questionsData as any || [])

    } catch (error: any) {
      console.error('Error loading test details:', error)
      toast.error('Failed to load test details')
    } finally {
      setLoading(false)
    }
  }

  const removeQuestionFromTest = async (questionId: string) => {
    if (!confirm('Are you sure you want to remove this question from the test?')) return

    try {
      const { error } = await supabase
        .from('test_questions')
        .delete()
        .match({ test_id: params.id, question_id: questionId })

      if (error) throw error

      toast.success('Question removed')
      loadTestDetails()
    } catch (error: any) {
      toast.error('Failed to remove question')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Test not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-sm text-gray-500">
              Created {formatDate(test.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowAddQuestions(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Questions
          </Button>
        </div>
      </div>

      {/* Test Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <h3 className="text-2xl font-bold">{test.duration_minutes} min</h3>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Marks</p>
                <h3 className="text-2xl font-bold">{test.total_marks}</h3>
              </div>
              <Award className="w-8 h-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Difficulty</p>
                <h3 className="text-2xl font-bold capitalize">{test.difficulty}</h3>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                test.difficulty === 'easy' ? 'bg-green-500' :
                test.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Questions</p>
                <h3 className="text-2xl font-bold">{testQuestions.length}</h3>
              </div>
              <GripVertical className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Test Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {testQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No questions added to this test yet.
            </div>
          ) : (
            <div className="space-y-4">
              {testQuestions.map((tq, index) => (
                <div 
                  key={`${tq.test_id}-${tq.question_id}`}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-none pt-1 text-gray-400">
                    <span className="font-mono text-sm">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {tq.question.question_text}
                    </p>
                    {tq.question.question_text_hi && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {tq.question.question_text_hi}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="info" className="text-xs">
                        {tq.question.subject}
                      </Badge>
                      <Badge variant="warning" className="text-xs">
                        {tq.question.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeQuestionFromTest(tq.question_id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddQuestionsDialog
        open={showAddQuestions}
        onOpenChange={setShowAddQuestions}
        onSuccess={loadTestDetails}
        testId={params.id as string}
        existingQuestionIds={testQuestions.map(tq => tq.question_id)}
      />
    </div>
  )
}
