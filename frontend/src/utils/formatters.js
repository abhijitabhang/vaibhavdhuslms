/**
 * Centralized formatting utilities for Vaibhav Dhus LMS.
 * Tailored for the Indian market with strict INR currency conventions.
 */

/**
 * Formats a numeric price into Indian Rupee format (₹) using Indian numbering system.
 * Examples:
 *   formatINR(499) -> "₹499"
 *   formatINR(1499) -> "₹1,499"
 *   formatINR(2499) -> "₹2,499"
 *   formatINR(9999) -> "₹9,999"
 *   formatINR(100000) -> "₹1,00,000"
 *   formatINR(0) -> "Free" (optional flag)
 *
 * @param {number|string} amount
 * @param {boolean} [showFreeIfZero=false]
 * @returns {string}
 */
export function formatINR(amount, showFreeIfZero = false) {
  if (amount === null || amount === undefined || amount === '') {
    return showFreeIfZero ? 'Free' : '₹0';
  }

  const numeric = Math.round(Number(amount));
  if (isNaN(numeric) || numeric === 0) {
    return showFreeIfZero ? 'Free' : '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numeric);
}

/**
 * Formats seconds into human readable duration
 * Example: 18400 -> "5h 6m" or "45 min"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0 min';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  }
  return `${mins} min`;
}

/**
 * Formats bytes to readable size
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const kb = Math.round(bytes / 1024);
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${kb} KB`;
}
