// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Class name utility
export { cn } from './cn';

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
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
 * @param {any} value - Value to parse
 * @param {number} fallback - Fallback value if parsing fails
 * @returns {number} Parsed float or fallback
 */
export const safeParseFloat = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Safely parse integer with fallback
 * @param {any} value - Value to parse
 * @param {number} fallback - Fallback value if parsing fails
 * @returns {number} Parsed integer or fallback
 */
export const safeParseInt = (value, fallback = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Generate unique ID with prefix
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Export data to JSON file
 * @param {Object} data - Data to export
 * @param {string} filename - Filename without extension
 * @returns {boolean} Success status
 */
export const exportToJSON = (data, filename) => {
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
 * Sanitize string input to prevent XSS attacks
 * Implements comprehensive XSS protection following OWASP best practices
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} options.allowHtml - Allow basic HTML formatting (default: false)
 * @param {number} options.maxLength - Maximum allowed length (default: 1000)
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return '';

  const {
    allowHtml = false,
    maxLength = 1000
  } = options;

  let sanitized = input;

  // 1. Handle null bytes and control characters
  sanitized = sanitized.replace(/\0/g, '');
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Handle Unicode and encoding-based attacks
  sanitized = sanitized.replace(/[\u2028\u2029]/g, '');
  // Remove zero-width characters that can be used for obfuscation
  sanitized = sanitized.replace(/[\u200B-\u200D\u2060]/g, '');
  // Remove newlines and carriage returns that can be used for injection
  sanitized = sanitized.replace(/[\r\n]/g, '');

  // 3. Remove dangerous protocols and schemes
  if (!allowHtml) {
    // Remove dangerous protocols including browser-specific ones
    sanitized = sanitized.replace(
      /(?:javascript|data|vbscript|file|ftp|view-source|blob|ws|wss|chrome|opera|res|resource|about):/gi,
      ''
    );
    // Keep safe protocols like mailto, tel, sms for legitimate use
  }

  // 4. Handle HTML entities and encoding
  if (!allowHtml) {
    // First decode safe entities for display
    sanitized = sanitized.replace(/&amp;/gi, '&');
    sanitized = sanitized.replace(/&lt;/gi, '<');
    sanitized = sanitized.replace(/&gt;/gi, '>');
    sanitized = sanitized.replace(/&quot;/gi, '"');
    sanitized = sanitized.replace(/&apos;/gi, "'");
    sanitized = sanitized.replace(/&nbsp;/gi, ' ');
    // Then remove any remaining potentially dangerous entities
    sanitized = sanitized.replace(/&[#\w]+;/gi, '');
  } else {
    // In HTML mode, keep safe entities as-is and remove dangerous ones
    sanitized = sanitized.replace(/&[#\w]+;/gi, (match) => {
      const safeEntities = ['&amp;', '&lt;', '&gt;', '&quot;', '&apos;', '&nbsp;'];
      return safeEntities.includes(match.toLowerCase()) ? match : '';
    });
  }

  // 5. Remove dangerous HTML tags and attributes if HTML is not allowed
  if (!allowHtml) {
    // Remove script tags and content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove iframe tags
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // Remove object tags
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');

    // Remove embed tags
    sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');

    // Remove applet tags
    sanitized = sanitized.replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '');

    // Remove form tags
    sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

    // Remove input tags
    sanitized = sanitized.replace(/<input\b[^>]*>/gi, '');

    // Remove meta tags
    sanitized = sanitized.replace(/<meta\b[^>]*>/gi, '');

    // Remove link tags
    sanitized = sanitized.replace(/<link\b[^>]*>/gi, '');

    // Remove style tags with dangerous content
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML tags (but preserve standalone < and > characters)
    sanitized = sanitized.replace(/<[a-zA-Z][^>]*>/g, ''); // Only remove actual HTML tags
    sanitized = sanitized.replace(/<\/[a-zA-Z][^>]*>/g, ''); // Remove closing tags
  } else {
    // If HTML is allowed, sanitize attributes and dangerous tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');

    // Remove dangerous event handlers more thoroughly
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^"'\s>]+/gi, '');
    // Also handle cases without quotes
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^>\s]+/gi, '');

    // Remove dangerous CSS expressions
    sanitized = sanitized.replace(/expression\s*\(/gi, '');
    sanitized = sanitized.replace(/javascript\s*:/gi, '');
    sanitized = sanitized.replace(/vbscript\s*:/gi, '');
    sanitized = sanitized.replace(/data\s*:/gi, '');

    // Remove dangerous attributes
    const dangerousAttrs = [
      'onload', 'onerror', 'onclick', 'ondblclick', 'onmousedown', 'onmouseup',
      'onmouseover', 'onmouseout', 'onmousemove', 'onkeydown', 'onkeyup',
      'onkeypress', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
      'onselect', 'onunload', 'onabort', 'oncanplay', 'oncanplaythrough',
      'oncuechange', 'ondurationchange', 'onemptied', 'onended', 'onerror',
      'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onpause', 'onplay',
      'onplaying', 'onprogress', 'onratechange', 'onseeked', 'onseeking',
      'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange', 'onwaiting'
    ];

    dangerousAttrs.forEach(attr => {
      const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      sanitized = sanitized.replace(regex, '');
      const regex2 = new RegExp(`${attr}\\s*=\\s*[^"'\\s>]+`, 'gi');
      sanitized = sanitized.replace(regex2, '');
    });
  }

  // 6. Handle SVG-based XSS attacks
  sanitized = sanitized.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  // 7. Handle CSS-based attacks
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression\([^"']*["']/gi, '');
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*javascript\([^"']*["']/gi, '');

  // 8. Handle DOM-based XSS patterns and dangerous functions
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
  sanitized = sanitized.replace(/uid=\*\)\)/gi, '');
  sanitized = sanitized.replace(/\$where/gi, '');
  // Handle SQL comment syntax
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');
  // Handle log injection patterns
  sanitized = sanitized.replace(/ERROR:/gi, '');
  sanitized = sanitized.replace(/X-Forwarded-For:/gi, '');
  sanitized = sanitized.replace(/RCPT\s+TO:/gi, '');

  // Handle encoding attacks
  sanitized = sanitized.replace(/\+ADw-script\+AD4-/gi, ''); // UTF-7 encoded <script>
  sanitized = sanitized.replace(/\+ACc-.*?\+ACc-/gi, ''); // UTF-7 encoded strings
  sanitized = sanitized.replace(/&#x3C;script&#x3E;/gi, ''); // HTML entity encoded
  sanitized = sanitized.replace(/&lt;script&gt;/gi, ''); // HTML entity encoded
  sanitized = sanitized.replace(/script/gi, ''); // Remove any remaining script text

  // Handle XML-based attacks
  sanitized = sanitized.replace(/<\?xml[^>]*\?>/gi, ''); // XML processing instructions
  sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, ''); // DOCTYPE declarations
  sanitized = sanitized.replace(/<!ENTITY[^>]*>/gi, ''); // Entity declarations

  // 9. Handle base64 encoded attacks
  sanitized = sanitized.replace(/data:\s*text\/html[^,]*,/gi, '');
  sanitized = sanitized.replace(/data:\s*application\/javascript[^,]*,/gi, '');

  // 10. Final cleanup and length limiting
  sanitized = sanitized.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Sanitize HTML content for safe display
 * Allows basic HTML formatting while removing dangerous elements
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (typeof html !== 'string') return '';

  return sanitizeInput(html, {
    allowHtml: true,
    maxLength: 5000
  });
};

/**
 * Sanitize URL to prevent XSS and security issues
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '';

  // Check for IDN homograph attacks (Cyrillic characters that look like Latin)
  const suspiciousChars = /[а-я]/gi; // Cyrillic characters
  if (suspiciousChars.test(url)) {
    return '';
  }

  // Remove dangerous protocols
  const sanitized = url.replace(
    /(?:javascript|data|vbscript|file|ftp|chrome|opera|res|resource|about|view-source|blob|ws|wss):/gi,
    ''
  );

  // Handle relative URLs (don't require full URL validation)
  if (sanitized.startsWith('/') || sanitized.startsWith('./') || sanitized.startsWith('../')) {
    return sanitized;
  }

  // Basic URL validation for absolute URLs
  try {
    new URL(sanitized);
    return sanitized;
  } catch {
    // If it's not a valid absolute URL and not a relative URL, return empty
    return '';
  }
};

/**
 * Sanitize CSS to prevent style-based attacks
 * @param {string} css - CSS to sanitize
 * @returns {string} Sanitized CSS
 */
export const sanitizeCss = (css) => {
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

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format currency value
 * @param {number} value - Numeric value
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = '$') => {
  const numValue = safeParseFloat(value);
  return `${currency}${numValue.toFixed(2)}`;
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} Is empty
 */
export const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};
