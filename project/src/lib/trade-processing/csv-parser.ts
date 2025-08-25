import Papa from 'papaparse';
import { z } from 'zod';
import { CSVSchema, CSVColumn } from '@/types/trading';

export class CSVParser {
  private static readonly REQUIRED_FIELDS = {
    symbol: ['symbol', 'stock', 'instrument', 'name', 'script'],
    trade_type: ['type', 'trade_type', 'side', 'buy_sell', 'transaction_type'],
    quantity: ['quantity', 'qty', 'volume', 'shares'],
    price: ['price', 'rate', 'avg_price', 'execution_price'],
    amount: ['amount', 'value', 'total', 'net_amount'],
    trade_datetime: ['date', 'time', 'datetime', 'timestamp', 'trade_date', 'trade_time'],
    trade_time: ['time', 'trade_time', 'execution_time', 'trade_time'],
    brokerage: ['brokerage', 'brokerage_fee', 'commission', 'brokerage_fee'],
  };

  static async detectSchema(file: File): Promise<CSVSchema> {
    // Validate file input
    if (!file || !file.name) {
      throw new Error('Invalid file provided');
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('File must be a CSV file');
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        preview: 5,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            if (!results.meta.fields || results.meta.fields.length === 0) {
              throw new Error('No headers found in CSV file');
            }

            if (results.data.length === 0) {
              throw new Error('No data rows found in CSV file');
            }

            const schema = this.analyzeHeaders(results.meta.fields, results.data);
            resolve(schema);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  private static analyzeHeaders(headers: string[], sampleData: any[]): CSVSchema {
    const columns: CSVColumn[] = headers.map(header => {
      const sampleValues = sampleData
        .map(row => row[header])
        .filter(val => val !== null && val !== undefined && val !== '')
        .slice(0, 3);

      const columnType = this.inferColumnType(sampleValues);

      return {
        name: header,
        type: columnType,
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
      let matchedHeader: string | undefined;

      // Special handling for simplified Paytm CSV format FIRST (highest priority)
      if (field === 'symbol' && headers.find(h => h.toLowerCase() === 'script')) {
        matchedHeader = 'Script';
      } else if (field === 'trade_type' && headers.find(h => h.toLowerCase() === 'type')) {
        matchedHeader = 'Type';
      } else if (field === 'trade_datetime' && headers.find(h => h.toLowerCase() === 'date')) {
        matchedHeader = 'Date';
      } else if (field === 'trade_time' && headers.find(h => h.toLowerCase() === 'trade time')) {
        matchedHeader = 'Trade Time';
      } else if (field === 'brokerage' && headers.find(h => h.toLowerCase() === 'brokerage')) {
        matchedHeader = 'Brokerage';
      }

      // If no special match, try exact matches
      if (!matchedHeader) {
        matchedHeader = headers.find((header, index) => {
          const normalized = normalizedHeaders[index];
          return patterns.some(pattern => normalized === pattern.toLowerCase());
        });
      }

      // If still no match, try partial matches
      if (!matchedHeader) {
        matchedHeader = headers.find((header, index) => {
          const normalized = normalizedHeaders[index];
          return patterns.some(pattern =>
            normalized.includes(pattern.toLowerCase()) ||
            pattern.toLowerCase().includes(normalized)
          );
        });
      }

      if (matchedHeader) {
        mapping[field] = matchedHeader;
      } else {
        // FALLBACK: If we're missing essential fields, try to map them by position
        const essentialFields = ['symbol', 'trade_type', 'quantity', 'price', 'trade_datetime'];
        const missingFields = essentialFields.filter(field => !mapping[field]);

        if (missingFields.length > 0) {
          // Try to map by common positions
          if (!mapping.symbol && headers.length >= 1) {
            mapping.symbol = headers[1]; // Usually second column
          }
          if (!mapping.trade_type && headers.length >= 2) {
            mapping.trade_type = headers[2]; // Usually third column
          }
          if (!mapping.quantity && headers.length >= 3) {
            mapping.quantity = headers[3]; // Usually fourth column
          }
          if (!mapping.price && headers.length >= 4) {
            mapping.price = headers[4]; // Usually fifth column
          }
          if (!mapping.trade_datetime && headers.length >= 0) {
            mapping.trade_datetime = headers[0]; // Usually first column
          }
        }
      }
    });

    return mapping;
  }

  private static calculateConfidence(mapping: Record<string, string>): number {
    // Only check the essential required fields, not all fields in REQUIRED_FIELDS
    const essentialRequiredFields = ['symbol', 'trade_type', 'quantity', 'price', 'trade_datetime'];
    const mappedFields = Object.keys(mapping);
    const matchedCount = essentialRequiredFields.filter(field => mappedFields.includes(field)).length;

    return Math.round((matchedCount / essentialRequiredFields.length) * 100) / 100;
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

      // Special handling for date and time combination
      if (mapping.trade_datetime && row[mapping.trade_datetime]) {
        // If we have both date and time columns, combine them
        const dateCol = mapping.trade_datetime;
        const timeCol = Object.keys(mapping).find(key =>
          mapping[key].toLowerCase().includes('time') &&
          mapping[key] !== dateCol
        );

        if (timeCol && row[mapping[timeCol]]) {
          const dateStr = row[dateCol];
          const timeStr = row[mapping[timeCol]];

          // Combine date and time
          if (dateStr && timeStr) {
            mappedRow.trade_datetime = `${dateStr} ${timeStr}`;
          }
        }
      }

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
        // Handle DD-MM-YYYY format (Paytm CSV format)
        if (val.includes('-') && val.split('-')[0].length === 2) {
          const [day, month, year] = val.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (isNaN(date.getTime())) throw new Error(`Invalid date: ${val}`);
          return date.toISOString();
        }

        // Handle DD/MM/YYYY format
        if (val.includes('/') && val.split('/')[0].length === 2) {
          const [day, month, year] = val.split('/');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (isNaN(date.getTime())) throw new Error(`Invalid date: ${val}`);
          return date.toISOString();
        }

        const date = new Date(val);
        if (isNaN(date.getTime())) throw new Error(`Invalid date: ${val}`);
        return date.toISOString();
      }),
      trade_time: z.string().optional(),
      // Additional optional fields
      brokerage: z.number().or(z.string().transform(val => {
        const num = parseFloat(val.replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
      })).optional(),
      // Remove fields that are no longer in the simplified CSV
      // isin: z.string().optional(),
      // exchange: z.string().optional(),
      // product_type: z.string().optional(),
      // order_number: z.string().optional(),
      // trade_number: z.string().optional()
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