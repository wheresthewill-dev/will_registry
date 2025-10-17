/**
 * Formats a date string into a localized date format
 * @param dateString - The date string to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param options - Additional Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Error formatting date';
  }
}

/**
 * Formats a date to display relative time (e.g., "2 days ago")
 * @param dateString - The date string to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Relative time string
 */
export function formatRelativeTime(
  dateString: string | Date,
  locale: string = 'en-US'
): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Define time divisions
    const divisions: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
      { amount: 60, name: 'seconds' },
      { amount: 60, name: 'minutes' },
      { amount: 24, name: 'hours' },
      { amount: 7, name: 'days' },
      { amount: 4.34524, name: 'weeks' },
      { amount: 12, name: 'months' },
      { amount: Number.POSITIVE_INFINITY, name: 'years' }
    ];
    
    let duration = diffInSeconds;
    
    for (let i = 0; i < divisions.length; i++) {
      const division = divisions[i];
      
      if (Math.abs(duration) < division.amount) {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        return rtf.format(-Math.round(duration), division.name);
      }
      
      duration /= division.amount;
    }
    
    return formatDate(date, locale);
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return formatDate(dateString, locale);
  }
}
