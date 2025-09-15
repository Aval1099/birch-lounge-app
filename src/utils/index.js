// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
 * Sanitize string input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
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
