/**
 * Capitalizes the first letter of a string
 * @param text - The string to capitalize
 * @returns The string with its first letter capitalized
 */
export function capitalizeFirst(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Formats a string to title case (capitalize each word)
 * @param text - The string to format
 * @returns The string in title case
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncates a string if it exceeds a certain length
 * @param text - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - The suffix to add after truncation (default: '...')
 * @returns The truncated string
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Formats a name into initials
 * @param fullName - The full name to format
 * @returns Initials (e.g., "John Doe" becomes "JD")
 */
export function formatInitials(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return '';
  
  return fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('');
}
