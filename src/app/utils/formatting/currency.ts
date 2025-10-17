/**
 * Formats a number as currency based on locale and currency code
 * @param amount - The amount to format
 * @param currencyCode - The ISO 4217 currency code (default: 'USD')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if the amount is a valid number
  if (isNaN(numericAmount)) {
    return 'Invalid amount';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    // Fallback formatting
    return `${currencyCode} ${numericAmount.toFixed(2)}`;
  }
}

/**
 * Extracts numeric value from a currency string
 * @param currencyString - The currency string to parse
 * @returns The numeric value or null if invalid
 */
export function parseCurrencyValue(currencyString: string): number | null {
  // Remove currency symbols, commas and spaces
  const sanitized = currencyString.replace(/[^\d.-]/g, '');
  const value = parseFloat(sanitized);
  
  return isNaN(value) ? null : value;
}
