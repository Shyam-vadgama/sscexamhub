// Utility functions for file processing and PDF metadata extraction
// This file provides helpers for extracting page count, file size, and other metadata

import { PDFDocument } from 'pdf-lib'

export interface FileMetadata {
  pageCount?: number
  fileSizeMB: number
  dimensions?: {
    width: number
    height: number
  }
  mimeType: string
  extension: string
}

/**
 * Extract metadata from a PDF file
 * @param file - The PDF file to analyze
 * @returns Object containing page count and other metadata
 */
export async function extractPdfMetadata(file: File): Promise<FileMetadata> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    const pageCount = pdfDoc.getPageCount()
    const fileSizeMB = file.size / (1024 * 1024) // Convert bytes to MB
    
    // Get dimensions of first page
    const page = pdfDoc.getPage(0)
    const { width, height } = page.getSize()
    
    return {
      pageCount,
      fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
      dimensions: {
        width: Math.round(width),
        height: Math.round(height),
      },
      mimeType: file.type,
      extension: getFileExtension(file.name),
    }
  } catch (error) {
    console.error('Error extracting PDF metadata:', error)
    // Return basic metadata even if PDF parsing fails
    return {
      fileSizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
      mimeType: file.type,
      extension: getFileExtension(file.name),
    }
  }
}

/**
 * Extract metadata from an image file
 * @param file - The image file to analyze
 * @returns Object containing dimensions and other metadata
 */
export async function extractImageMetadata(file: File): Promise<FileMetadata> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        fileSizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        dimensions: {
          width: img.width,
          height: img.height,
        },
        mimeType: file.type,
        extension: getFileExtension(file.name),
      })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      // Return basic metadata if image can't be loaded
      resolve({
        fileSizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        mimeType: file.type,
        extension: getFileExtension(file.name),
      })
    }
    
    img.src = url
  })
}

/**
 * Extract metadata from any file
 * @param file - The file to analyze
 * @returns Object containing relevant metadata based on file type
 */
export async function extractFileMetadata(file: File): Promise<FileMetadata> {
  if (file.type === 'application/pdf') {
    return extractPdfMetadata(file)
  } else if (file.type.startsWith('image/')) {
    return extractImageMetadata(file)
  } else {
    // For other file types, return basic metadata
    return {
      fileSizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
      mimeType: file.type,
      extension: getFileExtension(file.name),
    }
  }
}

/**
 * Get file extension from filename
 * @param filename - The name of the file
 * @returns File extension (without dot)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * Format file size to human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Determine content type from file
 * @param file - The file to analyze
 * @returns Content type string (pdf, image, document, etc.)
 */
export function determineContentType(file: File): string {
  if (file.type === 'application/pdf') {
    return 'pdf'
  } else if (file.type.startsWith('image/')) {
    return 'image'
  } else if (file.type.startsWith('video/')) {
    return 'video'
  } else if (file.type.startsWith('audio/')) {
    return 'audio'
  } else if (
    file.type === 'application/msword' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'text/plain'
  ) {
    return 'document'
  } else {
    return 'other'
  }
}

/**
 * Sanitize filename for storage
 * @param filename - Original filename
 * @returns Sanitized filename safe for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  
  // Replace special characters with underscores
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  
  return sanitized || 'unnamed_file'
}
