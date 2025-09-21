import { PublicKey } from '@solana/web3.js';

/**
 * Enhanced security validation utilities
 */

// Validate Solana mint address format
export const validateSolanaMintAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required' };
  }

  // Remove whitespace
  const cleanAddress = address.trim();
  
  if (cleanAddress.length === 0) {
    return { isValid: false, error: 'Address cannot be empty' };
  }

  // Check length (Solana addresses are 44 characters in base58)
  if (cleanAddress.length !== 44) {
    return { isValid: false, error: 'Invalid address length' };
  }

  // Validate base58 format and ensure it's a valid PublicKey
  try {
    new PublicKey(cleanAddress);
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid Solana address format' };
  }
};

// Validate URL format with additional security checks
export const validateSecureUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const cleanUrl = url.trim();
  
  if (cleanUrl.length === 0) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  try {
    const urlObj = new URL(cleanUrl);
    
    // Only allow HTTPS for security
    if (urlObj.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTPS URLs are allowed' };
    }
    
    // Prevent localhost/private IP access (basic SSRF protection)
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return { isValid: false, error: 'Private/local URLs are not allowed' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Sanitize text input to prevent XSS
export const sanitizeTextInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

// Validate numeric values with range checking
export const validateNumericRange = (
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): { isValid: boolean; error?: string } => {
  if (typeof value !== 'number' || isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (value < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }
  
  if (value > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max}` };
  }
  
  return { isValid: true };
};

// Rate limiting helper (basic client-side)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  key: string, 
  maxAttempts: number = 5, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxAttempts - record.count };
};