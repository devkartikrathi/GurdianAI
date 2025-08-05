import Papa from 'papaparse';
import { z } from 'zod';
import { CSVSchema, CSVColumn } from '@/types/trading';

export class CSVParser {
  private static readonly REQUIRED_FIELDS = {
    symbol: ['symbol', 'stock', 'instrument', 'scrip', 'name'],
    trade_type: ['type', 'trade_type', 'side', 'buy_sell', 'transaction_type'],
    quantity: ['quantity', 'qty', 'volume', 'shares'],
    price: ['price', 'rate', 'avg_price', 'execution_price'],
    amount: ['amount', 'value', 'total', 'net_amount'],
    trade_datetime: ['date', 'time', 'datetime', 'timestamp', 'trade_date']
  };

  static async detectSchema(file: File): Promise<CSVSchema> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        preview: 5,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const schema = this.analyzeHeaders(results.meta.fields || [], results.data);
            resolve(schema);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  private static analyzeHeaders(headers: string[], sampleData: any[]): CSVSchema {
    const columns: CSVColumn[] = headers.map(header => {
      const sampleValues = sampleData
        .map(row => row[header])
        .filter(val => val !== null && val !== undefined && val !== '')
        .slice(0, 3);

      return {
        name: header,
        type: this.inferColumnType(sampleValues),
        sample_values: sampleValues.map(val => String(val))
      };
    });

    const suggestedMapping = this.generateMapping(headers);
    const confidenceScore = this.calculateConfidence(suggestedMapping);

    return {
      columns,
      suggested_mapping: suggestedMapping,
      confidence_score: confidenceScore
    };
  }

  private static inferColumnType(values: any[]): 'string' | 'number' | 'date' {
    if (values.length === 0) return 'string';

    // Check for dates
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}/, // DD-MM-YYYY
    ];

    if (values.some(val => datePatterns.some(pattern => pattern.test(String(val))))) {
      return 'date';
    }

    // Check for numbers
    if (values.every(val => !isNaN(Number(val)) && isFinite(Number(val)))) {
      return 'number';
    }

    return 'string';
  }

  private static generateMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[_\s]/g, ''));

    Object.entries(this.REQUIRED_FIELDS).forEach(([field, patterns]) => {
      const matchedHeader = headers.find((header, index) => {
        const normalized = normalizedHeaders[index];
        return patterns.some(pattern => 
          normalized.includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(normalized)
        );
      });

      if (matchedHeader) {
        mapping[field] = matchedHeader;
      }
    });

    return mapping;
  }

  private static calculateConfidence(mapping: Record<string, string>): number {
    const requiredFields = Object.keys(this.REQUIRED_FIELDS);
    const mappedFields = Object.keys(mapping);
    const matchedCount = requiredFields.filter(field => mappedFields.includes(field)).length;
    
    return Math.round((matchedCount / requiredFields.length) * 100) / 100;
  }

  static async parseCSV(file: File, columnMapping: Record<string, string>) {
    return new Promise<any[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transform: (value, field) => {
          // Clean and normalize data
          if (typeof value === 'string') {
            return value.trim();
          }
          return value;
        },
        complete: (results) => {
          try {
            const mappedData = this.mapColumns(results.data, columnMapping);
            const validatedData = this.validateData(mappedData);
            resolve(validatedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  private static mapColumns(data: any[], mapping: Record<string, string>) {
    return data.map(row => {
      const mappedRow: any = {};
      
      Object.entries(mapping).forEach(([targetField, sourceField]) => {
        mappedRow[targetField] = row[sourceField];
      });

      return mappedRow;
    });
  }

  private static validateData(data: any[]) {
    const TradeSchema = z.object({
      symbol: z.string().min(1),
      trade_type: z.enum(['BUY', 'SELL']).or(z.string().transform(val => 
        val.toUpperCase() === 'BUY' || val.toUpperCase() === 'B' ? 'BUY' : 'SELL'
      )),
      quantity: z.number().or(z.string().transform(val => {
        const num = parseFloat(val.replace(/,/g, ''));
        if (isNaN(num)) throw new Error(`Invalid quantity: ${val}`);
        return Math.abs(num);
      })),
      price: z.number().or(z.string().transform(val => {
        const num = parseFloat(val.replace(/,/g, ''));
        if (isNaN(num)) throw new Error(`Invalid price: ${val}`);
        return num;
      })),
      amount: z.number().optional().or(z.string().transform(val => {
        const num = parseFloat(val.replace(/,/g, ''));
        return isNaN(num) ? undefined : Math.abs(num);
      }).optional()),
      trade_datetime: z.string().transform(val => {
        const date = new Date(val);
        if (isNaN(date.getTime())) throw new Error(`Invalid date: ${val}`);
        return date.toISOString();
      })
    });

    return data.map((row, index) => {
      try {
        const validated = TradeSchema.parse(row);
        
        // Calculate amount if not provided
        if (!validated.amount) {
          validated.amount = validated.quantity * validated.price;
        }

        return validated;
      } catch (error) {
        throw new Error(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Validation failed'}`);
      }
    });
  }
}