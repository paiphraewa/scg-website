// components/file-viewer.tsx
'use client'

import { useState } from 'react'

interface FileViewerProps {
  filePath: string
  fileName: string
  documentType: string
}

export function FileViewer({ filePath, fileName, documentType }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Function to convert file:// URLs to proper API URLs
  const getFileUrl = (path: string): string => {
    // Handle file:// URLs
    if (path.startsWith('file:///api/uploads/')) {
      const cleanPath = path.replace('file:///api/uploads/', '')
      return `/api/uploads/${cleanPath}`
    }
    
    // Handle relative paths (without /api/uploads/ prefix)
    if (!path.startsWith('/api/uploads/') && !path.startsWith('/') && !path.startsWith('http')) {
      return `/api/uploads/${path}`
    }
    
    return path
  }

  const correctedFilePath = getFileUrl(filePath)

  const handleViewFile = async () => {
    setIsLoading(true)
    try {
      // Open file in new tab
      window.open(correctedFilePath, '_blank')
    } catch (error) {
      console.error('Error opening file:', error)
      alert('Failed to open file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadFile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(correctedFilePath)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 mb-4">
      <h4 className="font-semibold capitalize">{documentType.replace(/([A-Z])/g, ' $1')}</h4>
      <p className="text-sm text-gray-600 truncate">{fileName}</p>
      <p className="text-xs text-gray-400 truncate mt-1">{correctedFilePath}</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleViewFile}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Opening...' : 'View File'}
        </button>
        <button
          onClick={handleDownloadFile}
          disabled={isLoading}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Downloading...' : 'Download'}
        </button>
      </div>
    </div>
  )
}