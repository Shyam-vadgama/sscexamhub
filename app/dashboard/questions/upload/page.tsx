'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function BulkUploadPage() {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [tests, setTests] = useState<any[]>([])
  const [selectedTestId, setSelectedTestId] = useState<string>('')

  // Fetch Tests on Load
  useEffect(() => {
    const fetchTests = async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('id, title')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tests:', error);
        toast.error('Failed to load tests');
      } else {
        setTests(data || []);
      }
    };
    fetchTests();
  }, [supabase]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      parseFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  })

  const parseFile = async (file: File) => {
    setParsing(true)
    setErrors([])
    
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Validate and transform data
      const validQuestions: any[] = []
      const validationErrors: string[] = []

      jsonData.forEach((row: any, index: number) => {
        const rowNum = index + 2 // +2 because Excel rows start at 1 and we have header

        // Required fields validation
        if (!row.question_en) {
          validationErrors.push(`Row ${rowNum}: Missing question_en`)
          return
        }
        if (!row.option_a_en || !row.option_b_en || !row.option_c_en || !row.option_d_en) {
          validationErrors.push(`Row ${rowNum}: Missing options`)
          return
        }
        if (!row.correct_option || !['a', 'b', 'c', 'd'].includes(row.correct_option.toLowerCase())) {
          validationErrors.push(`Row ${rowNum}: Invalid correct_option (must be a, b, c, or d)`)
          return
        }
        if (!row.subject) {
          validationErrors.push(`Row ${rowNum}: Missing subject`)
          return
        }

        validQuestions.push({
          question_text: row.question_en,
          question_text_hi: row.question_hi || null,
          option_a: row.option_a_en,
          option_a_hi: row.option_a_hi || null,
          option_b: row.option_b_en,
          option_b_hi: row.option_b_hi || null,
          option_c: row.option_c_en,
          option_c_hi: row.option_c_hi || null,
          option_d: row.option_d_en,
          option_d_hi: row.option_d_hi || null,
          correct_answer: row.correct_option.toLowerCase(),
          subject: row.subject,
          difficulty: row.difficulty || 'medium',
          explanation: row.explanation_en || null,
          explanation_hi: row.explanation_hi || null,
        })
      })

      setQuestions(validQuestions)
      setErrors(validationErrors)
      
      if (validQuestions.length > 0) {
        toast.success(`Parsed ${validQuestions.length} questions successfully`)
      }
      if (validationErrors.length > 0) {
        toast.error(`Found ${validationErrors.length} errors`)
      }
    } catch (error: any) {
      toast.error('Failed to parse file')
      console.error(error)
    } finally {
      setParsing(false)
    }
  }

  const handleUpload = async () => {
    if (questions.length === 0) return
    if (!selectedTestId) {
      toast.error('Please select a test to link these questions to');
      return;
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // 1. Upload Questions to 'questions' table
      const batchSize = 100
      const totalBatches = Math.ceil(questions.length / batchSize)
      let allInsertedQuestions: any[] = [];

      for (let i = 0; i < totalBatches; i++) {
        const batch = questions.slice(i * batchSize, (i + 1) * batchSize)
        
        const { data, error } = await supabase
          .from('questions')
          .insert(batch)
          .select('id') // We need IDs back to link them

        if (error) throw error
        if (data) allInsertedQuestions = [...allInsertedQuestions, ...data];

        setUploadProgress(((i + 1) / totalBatches) * 50) // First 50% for questions
      }

      // 2. Link Questions to 'test_questions' table
      if (allInsertedQuestions.length > 0) {
        const testQuestionsLinks = allInsertedQuestions.map((q, index) => ({
          test_id: selectedTestId,
          question_id: q.id,
          order_index: index + 1
        }));

        // Insert links in batches too
        const linkBatches = Math.ceil(testQuestionsLinks.length / batchSize);
        for (let i = 0; i < linkBatches; i++) {
           const batch = testQuestionsLinks.slice(i * batchSize, (i + 1) * batchSize);
           const { error: linkError } = await supabase
             .from('test_questions')
             .insert(batch);
           
           if (linkError) throw linkError;
           setUploadProgress(50 + ((i + 1) / linkBatches) * 50); // Remaining 50% for links
        }
      }

      toast.success(`Successfully uploaded and linked ${questions.length} questions to the test!`)
      
      // Reset
      setFile(null)
      setQuestions([])
      setErrors([])
      // setSelectedTestId('') // Keep selected test for convenience if uploading multiple files for same test? No, reset is safer.
      setSelectedTestId('')

    } catch (error: any) {
      toast.error('Failed to upload questions')
      console.error(error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadSample = () => {
    const sampleData = [
      {
        question_en: 'What is 2 + 2?',
        question_hi: '2 + 2 क्या है?',
        option_a_en: '3',
        option_a_hi: '3',
        option_b_en: '4',
        option_b_hi: '4',
        option_c_en: '5',
        option_c_hi: '5',
        option_d_en: '6',
        option_d_hi: '6',
        correct_option: 'b',
        subject: 'Quantitative Aptitude',
        difficulty: 'easy',
        explanation: '2 + 2 equals 4',
        explanation_hi: '2 + 2 बराबर 4',
      },
    ]

    const ws = XLSX.utils.json_to_sheet(sampleData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Questions')
    XLSX.writeFile(wb, 'question_template.xlsx')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href="/dashboard/questions">
            <Button variant="outline" size="sm">← Back to Questions</Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Bulk Question Upload</h1>
          <p className="text-gray-600 mt-1">
            Upload questions and automatically link them to a Test
          </p>
        </div>
        <Button variant="outline" onClick={downloadSample} className="w-full md:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Instructions */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Select the Test you want to add questions to.</li>
          <li>Download the template file using the button above.</li>
          <li>Fill in your questions following the template format.</li>
          <li>Upload your completed file below.</li>
        </ol>
      </Card>

      {/* Test Selection */}
      <Card className="p-6">
         <div className="space-y-2">
            <Label htmlFor="test-select">Select Test to Link Questions</Label>
            <Select
              id="test-select"
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full md:w-[400px]"
            >
              <option value="">Select a test...</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </Select>
            <p className="text-sm text-gray-500">
               Questions uploaded below will be automatically linked to this test.
            </p>
         </div>
      </Card>

      {/* Upload Zone */}
      <Card className="p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {file ? (
            <div>
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-700 mb-2">
                Drag & drop your file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports CSV, XLS, XLSX files
              </p>
            </div>
          )}
        </div>

        {parsing && (
          <div className="mt-6 text-center">
            <div className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 mt-2">Parsing file...</p>
          </div>
        )}
      </Card>

      {/* Preview */}
      {questions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Preview</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">{questions.length} Valid</span>
              </div>
              {errors.length > 0 && (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">{errors.length} Errors</span>
                </div>
              )}
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-2">Validation Errors:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.slice(0, 10).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {errors.length > 10 && (
                      <li className="font-medium">... and {errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Sample Questions */}
          <div className="space-y-3 mb-6">
            {questions.slice(0, 3).map((q, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">{q.question_text}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className={q.correct_answer === 'a' ? 'text-green-700 font-medium' : 'text-gray-600'}>
                    A. {q.option_a}
                  </div>
                  <div className={q.correct_answer === 'b' ? 'text-green-700 font-medium' : 'text-gray-600'}>
                    B. {q.option_b}
                  </div>
                  <div className={q.correct_answer === 'c' ? 'text-green-700 font-medium' : 'text-gray-600'}>
                    C. {q.option_c}
                  </div>
                  <div className={q.correct_answer === 'd' ? 'text-green-700 font-medium' : 'text-gray-600'}>
                    D. {q.option_d}
                  </div>
                </div>
              </div>
            ))}
            {questions.length > 3 && (
              <p className="text-sm text-gray-500 text-center">
                ... and {questions.length - 3} more questions
              </p>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Ready to upload {questions.length} questions to <b>{tests.find(t => t.id === selectedTestId)?.title || '...'}</b>
            </p>
            <Button onClick={handleUpload} disabled={uploading || errors.length > 0 || !selectedTestId}>
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading... {uploadProgress.toFixed(0)}%
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Link Questions
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
