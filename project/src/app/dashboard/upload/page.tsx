"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'

export default function UploadPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [parsedData, setParsedData] = useState<any[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadStatus('uploading')
    setUploadProgress(0)
    setUploadMessage('Processing CSV file...')

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      // Parse CSV
      const text = await file.text()
      Papa.parse(text as any, {
        header: true,
        complete: async (results) => {
          setParsedData(results.data as any[])
          
          // Simulate API call
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/trades/upload', {
            method: 'POST',
            body: formData,
          })

          clearInterval(interval)
          setUploadProgress(100)

          if (response.ok) {
            const result = await response.json()
            setUploadStatus('success')
            setUploadMessage(`Successfully uploaded ${result.total_trades} trades`)
          } else {
            const error = await response.json()
            setUploadStatus('error')
            setUploadMessage(error.error || 'Upload failed')
          }
        },
        error: (error: any) => {
          clearInterval(interval)
          setUploadStatus('error')
          setUploadMessage(`CSV parsing error: ${error.message}`)
        }
      })
    } catch (error) {
      clearInterval(interval)
      setUploadStatus('error')
      setUploadMessage('Failed to process file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  })

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
      default:
        return <Upload className="h-6 w-6 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Trades</h1>
        <p className="text-muted-foreground mt-2">
          Upload your trade data in CSV format for analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Trade Data Upload
          </CardTitle>
          <CardDescription>
            Drag and drop your CSV file here, or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground mb-2">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV file here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to select a file
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Supported format: CSV with columns for symbol, trade type, quantity, price, and date/time
            </p>
          </div>

          {uploadStatus !== 'idle' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm font-medium text-foreground">
                  {uploadMessage}
                </span>
              </div>
              
              {uploadStatus === 'uploading' && (
                <Progress value={uploadProgress} className="h-2" />
              )}

              {parsedData.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Preview ({parsedData.length} rows)
                  </h4>
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          {Object.keys(parsedData[0] || {}).map((header) => (
                            <th key={header} className="px-2 py-1 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-t">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="px-2 py-1">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Required Columns</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Symbol/Stock name</li>
                <li>• Trade type (BUY/SELL)</li>
                <li>• Quantity</li>
                <li>• Price</li>
                <li>• Date and time</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Supported Formats</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• CSV files (.csv)</li>
                <li>• Excel exports</li>
                <li>• Broker statements</li>
                <li>• Custom trade logs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}