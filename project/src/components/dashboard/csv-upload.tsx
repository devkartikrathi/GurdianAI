'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Bot, Sparkles } from 'lucide-react';
import { CSVSchema, TradeUploadResult } from '@/types/trading';
import { toast } from 'sonner';

interface CSVUploadProps {
  onUploadComplete: (result: TradeUploadResult) => void;
}

export function CSVUpload({ onUploadComplete }: CSVUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [schema, setSchema] = useState<CSVSchema | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isDetecting, setIsDetecting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<'select' | 'mapping' | 'upload'>('select');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      detectSchema(file);
    } else {
      toast.error('Please select a valid CSV file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const detectSchema = async (file: File) => {
    console.log('🚀 detectSchema called with file:', file.name, file.size, file.type);
    setIsDetecting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Sending file to schema detection API...');
      console.log('📤 FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await fetch('/api/trades/schema-detect', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Schema detection response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Schema detection failed:', errorText);
        throw new Error(`Failed to detect schema: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log('📥 Schema detection response data:', responseData);
      
      const { schema } = responseData;
      
      if (!schema) {
        throw new Error('No schema returned from API');
      }

      console.log('✅ Schema received:', schema);
      console.log('✅ Columns count:', schema.columns?.length);
      console.log('✅ Confidence score:', schema.confidence_score);
      console.log('✅ Suggested mapping:', schema.suggested_mapping);

      setSchema(schema);
      setColumnMapping(schema.suggested_mapping);
      setStep('mapping');
      
      if (schema.confidence_score >= 0.8) {
        toast.success('AI detected schema with high confidence!', {
          description: 'Please verify the column mapping below.'
        });
      } else if (schema.confidence_score >= 0.6) {
        toast.warning('AI detected schema with medium confidence', {
          description: 'Please review and adjust the column mapping.'
        });
      } else {
        toast.error('AI had difficulty detecting the schema', {
          description: 'Please manually map the columns below.'
        });
      }
    } catch (error) {
      console.error('❌ Schema detection error:', error);
      toast.error('Failed to detect CSV schema: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDetecting(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !schema) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('columnMapping', JSON.stringify(columnMapping));

      // Debug logging
      console.log('Uploading with column mapping:', columnMapping);
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await fetch('/api/trades/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const result: TradeUploadResult = await response.json();
      
      if (result.success) {
        toast.success(`Successfully processed ${result.total_trades} trades!`, {
          description: `Matched ${result.matched_trades} trades, ${result.open_positions} open positions`
        });
        onUploadComplete(result);
        resetUpload();
      } else {
        toast.error('Upload failed: ' + (result.errors?.join(', ') || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload trades: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setSchema(null);
    setColumnMapping({});
    setStep('select');
  };

  const requiredFields = [
    { key: 'symbol', label: 'Symbol/Stock Name', required: true },
    { key: 'trade_type', label: 'Trade Type (BUY/SELL)', required: true },
    { key: 'quantity', label: 'Quantity', required: true },
    { key: 'price', label: 'Price', required: true },
    { key: 'amount', label: 'Amount/Value', required: false },
    { key: 'trade_datetime', label: 'Date/Time', required: true },
    { key: 'trade_time', label: 'Trade Time (Optional)', required: false },
    // Additional optional fields for simplified Paytm CSV
    { key: 'brokerage', label: 'Brokerage', required: false },
  ];

  if (step === 'select') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Trading Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the CSV file here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop your CSV file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Our AI will automatically detect and map your columns
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-sm text-gray-500">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                {isDetecting && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Bot className="h-4 w-4 text-blue-500 animate-pulse" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-blue-600">AI analyzing...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 'mapping' && schema) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Verify Column Mapping
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">AI Confidence: </span>
              <span className={`font-medium ${
                schema.confidence_score >= 0.8 ? 'text-green-600' : 
                schema.confidence_score >= 0.6 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {Math.round(schema.confidence_score * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-gray-600">Columns Found: {schema.columns.length}</span>
            </div>
          </div>
          
          {/* Paytm CSV Compatibility Message */}
          {schema.columns.some(col => 
            ['Script', 'Type', 'Quantity', 'Price', 'Date', 'Trade Time', 'Brokerage'].includes(col.name)
          ) && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Paytm CSV Detected!</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                We've detected a Paytm tradebook format with {schema.columns.length} columns. 
                The AI should automatically map all columns correctly.
                Please verify the mapping below and adjust if needed.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={columnMapping[field.key] || ''}
                  onChange={(e) =>
                    setColumnMapping(prev => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                >
                  <option value="">Select column...</option>
                  {schema.columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                      {col.sample_values.length > 0 && 
                        ` - e.g., ${col.sample_values[0]}`
                      }
                    </option>
                  ))}
                </select>
                {columnMapping[field.key] && (
                  <div className="text-xs text-gray-500">
                    Mapped to: <span className="font-medium">{columnMapping[field.key]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sample Data Preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Sample Data Preview</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {schema.columns.slice(0, 6).map((col) => (
                      <th key={col.name} className="text-left p-2 font-medium">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schema.columns[0]?.sample_values.slice(0, 3).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b">
                      {schema.columns.slice(0, 6).map((col) => (
                        <td key={col.name} className="p-2 text-gray-600">
                          {col.sample_values[rowIndex] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Detected Columns */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-3 text-blue-800">All Detected Columns ({schema.columns.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {schema.columns.map((col) => (
                <div key={col.name} className="p-3 bg-white rounded border">
                  <div className="font-medium text-sm text-gray-800">{col.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{col.type}</div>
                  {col.sample_values.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      Sample: {col.sample_values[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={resetUpload}>
              Start Over
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
              >
                Back
              </Button>
              <Button
                onClick={handleUpload}
                disabled={
                  isUploading ||
                  !columnMapping.symbol ||
                  !columnMapping.trade_type ||
                  !columnMapping.quantity ||
                  !columnMapping.price ||
                  !columnMapping.trade_datetime
                }
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Upload & Process'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}