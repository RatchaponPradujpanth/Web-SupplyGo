import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/responseHandler';

export interface ValidationRule {
  field: string;
  type?: 'string' | 'number' | 'email' | 'array' | 'boolean';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export class Validator {
  static validate(rules: ValidationRule[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors: string[] = [];

      for (const rule of rules) {
        const value = req.body[rule.field];

        // Check required
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(`${rule.field} เป็นข้อมูลที่จำเป็น`);
          continue;
        }

        // Skip further validation if field is not required and empty
        if (!rule.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Type validation
        if (rule.type) {
          switch (rule.type) {
            case 'string':
              if (typeof value !== 'string') {
                errors.push(`${rule.field} ต้องเป็น string`);
              }
              break;
            case 'number':
              if (typeof value !== 'number' && isNaN(Number(value))) {
                errors.push(`${rule.field} ต้องเป็นตัวเลข`);
              }
              break;
            case 'email':
              const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailPattern.test(value)) {
                errors.push(`${rule.field} ต้องเป็น email ที่ถูกต้อง`);
              }
              break;
            case 'array':
              if (!Array.isArray(value)) {
                errors.push(`${rule.field} ต้องเป็น array`);
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean') {
                errors.push(`${rule.field} ต้องเป็น boolean`);
              }
              break;
          }
        }

        // Min/Max validation for numbers and strings
        if (rule.min !== undefined) {
          if (typeof value === 'number' && value < rule.min) {
            errors.push(`${rule.field} ต้องมากกว่าหรือเท่ากับ ${rule.min}`);
          } else if (typeof value === 'string' && value.length < rule.min) {
            errors.push(`${rule.field} ต้องมีความยาวอย่างน้อย ${rule.min} ตัวอักษร`);
          }
        }

        if (rule.max !== undefined) {
          if (typeof value === 'number' && value > rule.max) {
            errors.push(`${rule.field} ต้องน้อยกว่าหรือเท่ากับ ${rule.max}`);
          } else if (typeof value === 'string' && value.length > rule.max) {
            errors.push(`${rule.field} ต้องมีความยาวไม่เกิน ${rule.max} ตัวอักษร`);
          }
        }

        // Pattern validation
        if (rule.pattern && typeof value === 'string') {
          if (!rule.pattern.test(value)) {
            errors.push(`${rule.field} มีรูปแบบไม่ถูกต้อง`);
          }
        }
      }

      if (errors.length > 0) {
        return ResponseHandler.badRequest(res, 'ข้อมูลไม่ถูกต้อง', errors.join(', '));
      }

      next();
    };
  }
}
