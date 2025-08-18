"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, AlertCircle, Database, Shield, Sparkles } from 'lucide-react'
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
          
          // Create column mapping based on CSV headers
          const headers = results.meta.fields || []
          const columnMapping = {
            symbol: headers.find(h => h.toLowerCase().includes('symbol')) || 'symbol',
            trade_type: headers.find(h => h.toLowerCase().includes('trade_type') || h.toLowerCase().includes('type')) || 'trade_type',
            quantity: headers.find(h => h.toLowerCase().includes('quantity') || h.toLowerCase().includes('qty')) || 'quantity',
            price: headers.find(h => h.toLowerCase().includes('price')) || 'price',
            trade_datetime: headers.find(h => h.toLowerCase().includes('datetime') || h.toLowerCase().includes('date') || h.toLowerCase().includes('time')) || 'trade_datetime'
          }

          // Send API call with column mapping
          const formData = new FormData()
          formData.append('file', file)
          formData.append('columnMapping', JSON.stringify(columnMapping))

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
        return <CheckCircle className="h-6 w-6 text-success" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-danger" />
      default:
        return <Upload className="h-6 w-6 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Upload Trades</h1>
            <p className="text-muted-foreground">Upload your trade data in CSV format for AI analysis</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-2">
          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Trade Data Upload</CardTitle>
              </div>
              <CardDescription>
                Drag and drop your CSV file here, or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/25'
                    : 'border-border hover:border-primary/50 hover:bg-accent/5'
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
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
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
                      <div className="max-h-40 overflow-y-auto border rounded-lg bg-card">
                        <div className="overflow-x-auto">
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
                                <tr key={index} className="border-t border-border/50">
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
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Guidelines Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <CardTitle>Upload Guidelines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Required Columns</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Symbol/Stock name
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Trade type (BUY/SELL)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Quantity
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Price
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Date and time
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-success" />
                <CardTitle>Supported Formats</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  CSV files (.csv)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  Excel exports
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  Broker statements
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  Custom trade logs
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}