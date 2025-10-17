/**
 * Formats a number with thousands separators
 * @param value - The number to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | string,
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2
  }
): string {
  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if the value is a valid number
  if (isNaN(numericValue)) {
    return 'Invalid number';
  }

  try {
    return new Intl.NumberFormat(locale, options).format(numericValue);
  } catch (error) {
    console.error('Number formatting error:', error);
    return numericValue.toString();
  }
}

/**
 * Formats a number as a percentage
 * @param value - The number to format as percentage (0.1 = 10%)
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param decimalPlaces - The number of decimal places to show (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number | string,
  locale: string = 'en-US',
  decimalPlaces: number = 1
): string {
  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if the value is a valid number
  if (isNaN(numericValue)) {
    return 'Invalid percentage';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(numericValue);
  } catch (error) {
    console.error('Percentage formatting error:', error);
    return `${(numericValue * 100).toFixed(decimalPlaces)}%`;
  }
}
