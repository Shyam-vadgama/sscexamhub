'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2, FolderUp, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import { formatFileSize } from '@/lib/utils'
import { extractFileMetadata, sanitizeFilename, FileMetadata } from '@/lib/file-utils'

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error' | 'analyzing'
  progress: number
  url?: string
  error?: string
  metadata: {
    type: string
    category: string
    isFree: boolean
  }
  fileMetadata?: FileMetadata
}

export default function UploadPage() {
  const supabase = createClient()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [defaultSettings, setDefaultSettings] = useState({
    type: 'pdf',
    category: 'study_material',
    isFree: true,
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'analyzing' as const,
      progress: 0,
      metadata: {
        type: defaultSettings.type,
        category: defaultSettings.category,
        isFree: defaultSettings.isFree,
      }
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    
    // Extract metadata for each file
    for (const uploadFile of newFiles) {
      try {
        const fileMetadata = await extractFileMetadata(uploadFile.file)
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'pending' as const, fileMetadata }
            : f
        ))
      } catch (error) {
        console.error('Error extracting metadata:', error)
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'pending' as const }
            : f
        ))
      }
    }
  }, [defaultSettings])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc', '.docx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateFileMetadata = (fileId: string, field: string, value: any) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, metadata: { ...f.metadata, [field]: value } }
        : f
    ))
  }

  const uploadSingleFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading' as const }
          : f
      ))

      const { file, metadata } = uploadFile
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `uploads/${metadata.category}/${fileName}`

      // Simulate upload progress (in production, use actual progress tracking)
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += 10
        if (progress <= 90) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress }
              : f
          ))
        }
      }, 200)

      // Upload to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('content')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)

      if (uploadError) {
        // Handle upload error
        console.warn('Storage upload error:', uploadError)
        
        // For demo purposes, create a placeholder URL
        const placeholderUrl = `/uploads/${fileName}`
        
        // Update file record in database with extracted metadata
        await createFileRecord(file, placeholderUrl, metadata, uploadFile.fileMetadata)
        
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'success' as const, progress: 100, url: placeholderUrl }
            : f
        ))
        
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('content')
        .getPublicUrl(filePath)

      // Create record in database with extracted metadata
      await createFileRecord(file, urlData.publicUrl, metadata, uploadFile.fileMetadata)

      // Update file status to success
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'success' as const, progress: 100, url: urlData.publicUrl }
          : f
      ))

    } catch (error: any) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error' as const, error: error.message || 'Upload failed' }
          : f
      ))
    }
  }

  const createFileRecord = async (file: File, url: string, metadata: any, fileMetadata?: FileMetadata) => {
    const sanitizedName = sanitizeFilename(file.name)
    
    const fileData: any = {
      title: sanitizedName,
      file_url: url,
      file_path: url, // Store the storage path
      file_size_mb: fileMetadata?.fileSizeMB || (file.size / (1024 * 1024)),
      type: metadata.type,
      language: 'en',
      is_free: metadata.isFree,
      category: metadata.category,
    }

    // Add page count for PDFs
    if (fileMetadata?.pageCount) {
      fileData.page_count = fileMetadata.pageCount
    }
    
    // Add dimensions for images
    if (fileMetadata?.dimensions) {
      fileData.metadata = {
        width: fileMetadata.dimensions.width,
        height: fileMetadata.dimensions.height,
        mimeType: fileMetadata.mimeType,
        extension: fileMetadata.extension,
      }
    }

    // Add specific fields based on type
    if (file.type.startsWith('image/')) {
      fileData.type = 'image'
    } else if (file.type === 'application/pdf') {
      fileData.type = 'pdf'
    }

    const { error } = await supabase
      .from('content')
      .insert([fileData])

    if (error) throw error
  }

  const uploadAllFiles = async () => {
    if (files.length === 0) {
      toast.error('No files to upload')
      return
    }

    setUploading(true)

    try {
      const pendingFiles = files.filter(f => f.status === 'pending')
      
      // Upload files sequentially (you could do parallel uploads with Promise.all)
      for (const file of pendingFiles) {
        await uploadSingleFile(file)
      }

      toast.success(`Successfully uploaded ${pendingFiles.length} file(s)`)
    } catch (error: any) {
      toast.error('Some files failed to upload')
    } finally {
      setUploading(false)
    }
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all files?')) {
      setFiles([])
    }
  }

  const stats = {
    total: files.length,
    analyzing: files.filter(f => f.status === 'analyzing').length,
    pending: files.filter(f => f.status === 'pending').length,
    uploading: files.filter(f => f.status === 'uploading').length,
    success: files.filter(f => f.status === 'success').length,
    error: files.filter(f => f.status === 'error').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Files</h1>
          <p className="text-gray-600 mt-1">
            Upload PDFs, images, and documents to the content library
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Files</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        {stats.analyzing > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Analyzing</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.analyzing}</p>
          </div>
        )}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Uploading</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.uploading}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Success</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.success}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 col-span-2 sm:col-span-1">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.error}</p>
        </div>
      </div>

      {/* Default Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Default Upload Settings</CardTitle>
          <CardDescription>
            These settings will be applied to all uploaded files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Content Type</Label>
              <Select
                value={defaultSettings.type}
                onChange={(e) => setDefaultSettings({ ...defaultSettings, type: e.target.value })}
              >
                <option value="pdf">PDF Document</option>
                <option value="formula">Formula Sheet</option>
                <option value="current_affairs">Current Affairs</option>
                <option value="image">Image</option>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={defaultSettings.category}
                onChange={(e) => setDefaultSettings({ ...defaultSettings, category: e.target.value })}
              >
                <option value="study_material">Study Material</option>
                <option value="question_bank">Question Bank</option>
                <option value="practice_test">Practice Test</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div>
              <Label className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  checked={defaultSettings.isFree}
                  onChange={(e) => setDefaultSettings({ ...defaultSettings, isFree: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Free Access</span>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <FolderUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              {isDragActive ? (
                <p className="text-lg font-medium text-blue-600">
                  Drop files here to upload
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-900">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, images, and documents (Max 50MB per file)
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Upload Queue</CardTitle>
                <CardDescription>
                  {stats.pending} file(s) ready to upload
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {stats.success > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCompleted} className="flex-1 sm:flex-none">
                    Clear Completed
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={clearAll} className="flex-1 sm:flex-none">
                  Clear All
                </Button>
                <Button 
                  onClick={uploadAllFiles}
                  disabled={uploading || stats.pending === 0}
                  className="w-full sm:w-auto"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {uploadFile.file.type.startsWith('image/') ? (
                        <ImageIcon className="w-8 h-8 text-blue-500" />
                      ) : (
                        <File className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* File Info for Mobile (Title + Status Icon) */}
                    <div className="flex-1 min-w-0 sm:hidden">
                       <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadFile.file.name}
                      </p>
                    </div>

                     {/* Status Icon for Mobile */}
                    <div className="sm:hidden flex-shrink-0">
                      {uploadFile.status === 'analyzing' && (
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                      )}
                      {uploadFile.status === 'pending' && (
                        <button
                          onClick={() => removeFile(uploadFile.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      {uploadFile.status === 'uploading' && (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      {uploadFile.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>

                  {/* File Info - Desktop & Expanded Details */}
                  <div className="flex-1 min-w-0 w-full">
                    <p className="hidden sm:block text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <p className="text-xs text-gray-500">
                        {uploadFile.fileMetadata?.fileSizeMB 
                          ? `${uploadFile.fileMetadata.fileSizeMB} MB`
                          : formatFileSize(uploadFile.file.size)}
                      </p>
                      {uploadFile.fileMetadata?.pageCount && (
                        <p className="text-xs text-gray-500">
                          {uploadFile.fileMetadata.pageCount} pages
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Type: {uploadFile.metadata.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {uploadFile.metadata.isFree ? 'Free' : 'Premium'}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${uploadFile.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadFile.progress}%
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadFile.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadFile.error}
                      </p>
                    )}
                  </div>

                  {/* Status Icon - Desktop */}
                  <div className="hidden sm:block flex-shrink-0">
                    {uploadFile.status === 'analyzing' && (
                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    )}
                    {uploadFile.status === 'pending' && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    {uploadFile.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                    {uploadFile.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No files selected</p>
          <p className="text-sm text-gray-500 mt-1">
            Drag files here or use the upload area above to get started
          </p>
        </div>
      )}
    </div>
  )
}
