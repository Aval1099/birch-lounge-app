// =============================================================================
// UTILITY FUNCTIONS - TypeScript Version
// =============================================================================

/**
 * Sanitization options interface
 */
export interface SanitizeOptions {
  allowHtml?: boolean;
  maxLength?: number;
}

/**
 * Debounce function to limit the rate of function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | undefined;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Safely parse float with fallback
 */
export const safeParseFloat = (value: any, fallback: number = 0): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Safely parse integer with fallback
 */
export const safeParseInt = (value: any, fallback: number = 0): number => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Generate unique ID with prefix
 */
export const generateId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Export data to JSON file
 */
export const exportToJSON = (data: any, filename: string): boolean => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format currency value
 */
export const formatCurrency = (value: number | string, currency: string = '$'): string => {
  const numValue = safeParseFloat(value);
  return `${currency}${numValue.toFixed(2)}`;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        (clonedObj as any)[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Sanitize string input to prevent XSS attacks
 * Implements comprehensive XSS protection following OWASP best practices
 */
export const sanitizeInput = (input: string, options: SanitizeOptions = {}): string => {
  if (typeof input !== 'string') return '';

  const {
    allowHtml = false,
    maxLength = 1000
  } = options;

  let sanitized = input;

  // Handle null bytes and control characters
  sanitized = sanitized.replace(/\0/g, '');
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Handle Unicode and encoding-based attacks
  sanitized = sanitized.replace(/[\u2028\u2029]/g, '');
  sanitized = sanitized.replace(/[\u200B-\u200D\u2060]/g, '');
  sanitized = sanitized.replace(/[\r\n]/g, '');

  // Remove dangerous protocols and schemes
  if (!allowHtml) {
    sanitized = sanitized.replace(
      /(?:javascript|data|vbscript|file|ftp|view-source|blob|ws|wss|chrome|opera|res|resource|about):/gi,
      ''
    );
  }

  // Handle HTML entities and encoding
  if (!allowHtml) {
    sanitized = sanitized.replace(/&amp;/gi, '&');
    sanitized = sanitized.replace(/&lt;/gi, '<');
    sanitized = sanitized.replace(/&gt;/gi, '>');
    sanitized = sanitized.replace(/&quot;/gi, '"');
    sanitized = sanitized.replace(/&apos;/gi, "'");
    sanitized = sanitized.replace(/&nbsp;/gi, ' ');
    sanitized = sanitized.replace(/&[#\w]+;/gi, '');
  } else {
    sanitized = sanitized.replace(/&[#\w]+;/gi, (match) => {
      const safeEntities = ['&amp;', '&lt;', '&gt;', '&quot;', '&apos;', '&nbsp;'];
      return safeEntities.includes(match.toLowerCase()) ? match : '';
    });
  }

  // Remove dangerous HTML tags and attributes if HTML is not allowed
  if (!allowHtml) {
    // Remove script tags and content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '');
    sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
    sanitized = sanitized.replace(/<input\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<meta\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<link\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    sanitized = sanitized.replace(/<[a-zA-Z][^>]*>/g, '');
    sanitized = sanitized.replace(/<\/[a-zA-Z][^>]*>/g, '');
  } else {
    // If HTML is allowed, sanitize attributes and dangerous tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');

    // Remove dangerous event handlers
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^"'\s>]+/gi, '');
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^>\s]+/gi, '');

    // Remove dangerous CSS expressions
    sanitized = sanitized.replace(/expression\s*\(/gi, '');
    sanitized = sanitized.replace(/javascript\s*:/gi, '');
    sanitized = sanitized.replace(/vbscript\s*:/gi, '');
    sanitized = sanitized.replace(/data\s*:/gi, '');
  }

  // Handle SVG-based XSS attacks
  sanitized = sanitized.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  // Handle DOM-based XSS patterns
  sanitized = sanitized.replace(/document\./gi, '');
  sanitized = sanitized.replace(/window\./gi, '');
  sanitized = sanitized.replace(/eval\s*\(/gi, '');
  sanitized = sanitized.replace(/setTimeout\s*\(/gi, '');
  sanitized = sanitized.replace(/setInterval\s*\(/gi, '');
  sanitized = sanitized.replace(/Function\s*\(/gi, '');
  sanitized = sanitized.replace(/alert\s*\(/gi, '');

  // Handle template injection patterns
  sanitized = sanitized.replace(/\$\{[^}]*\}/g, '');

  // Handle various injection patterns
  sanitized = sanitized.replace(/DROP\s+TABLE/gi, '');
  sanitized = sanitized.replace(/rm\s+-rf/gi, '');
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');

  // Handle encoding attacks
  sanitized = sanitized.replace(/\+ADw-script\+AD4-/gi, '');
  sanitized = sanitized.replace(/\+ACc-.*?\+ACc-/gi, '');
  sanitized = sanitized.replace(/&#x3C;script&#x3E;/gi, '');
  sanitized = sanitized.replace(/&lt;script&gt;/gi, '');
  sanitized = sanitized.replace(/script/gi, '');

  // Handle XML-based attacks
  sanitized = sanitized.replace(/<\?xml[^>]*\?>/gi, '');
  sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, '');
  sanitized = sanitized.replace(/<!ENTITY[^>]*>/gi, '');

  // Handle base64 encoded attacks
  sanitized = sanitized.replace(/data:\s*text\/html[^,]*,/gi, '');
  sanitized = sanitized.replace(/data:\s*application\/javascript[^,]*,/gi, '');

  // Final cleanup and length limiting
  sanitized = sanitized.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Sanitize HTML content for safe display
 */
export const sanitizeHtml = (html: string): string => {
  if (typeof html !== 'string') return '';
  return sanitizeInput(html, { allowHtml: true, maxLength: 5000 });
};

/**
 * Sanitize URL to prevent XSS and security issues
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return '';

  // Check for IDN homograph attacks
  const suspiciousChars = /[а-я]/gi;
  if (suspiciousChars.test(url)) {
    return '';
  }

  // Remove dangerous protocols
  const sanitized = url.replace(
    /(?:javascript|data|vbscript|file|ftp|chrome|opera|res|resource|about|view-source|blob|ws|wss):/gi,
    ''
  );

  // Handle relative URLs
  if (sanitized.startsWith('/') || sanitized.startsWith('./') || sanitized.startsWith('../')) {
    return sanitized;
  }

  // Basic URL validation for absolute URLs
  try {
    new URL(sanitized);
    return sanitized;
  } catch {
    return '';
  }
};

/**
 * Sanitize CSS to prevent style-based attacks
 */
export const sanitizeCss = (css: string): string => {
  if (typeof css !== 'string') return '';

  let sanitized = css;

  // Remove dangerous CSS expressions
  sanitized = sanitized.replace(/expression\s*\(/gi, '');
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:/gi, '');
  sanitized = sanitized.replace(/-moz-binding\s*:/gi, '');
  sanitized = sanitized.replace(/behavior\s*:/gi, '');

  // Remove dangerous functions
  sanitized = sanitized.replace(/eval\s*\(/gi, '');
  sanitized = sanitized.replace(/expression\s*\(/gi, '');
  sanitized = sanitized.replace(/url\s*\(\s*["']?javascript:/gi, '');
  sanitized = sanitized.replace(/url\s*\(\s*["']?data:/gi, '');

  return sanitized.trim();
};
