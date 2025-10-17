export interface DocumentLocation {
    id: string; // Changed from number to string to match BaseEntity constraint
    user_id: number;
    description: string;
    last_updated: string | null; // ISO timestamp string
    document_label: string | null;
    url: string | null; // Legacy single URL field - kept for backward compatibility
    urls: string[]; // New multiple URLs field
}

// Helper function to check if document has any files
export function hasDocumentFile(document: DocumentLocation): boolean {
    // Check both legacy url field and new urls array
    return !!(document.url && document.url.trim() !== '') || 
           (document.urls && document.urls.length > 0);
}

// Helper function to get all file URLs (legacy + new)
export function getDocumentFileUrls(document: DocumentLocation): string[] {
    const urls: string[] = [];
    
    // Add legacy URL if it exists
    if (document.url && document.url.trim() !== '') {
        urls.push(document.url);
    }
    
    // Add new URLs array
    if (document.urls && Array.isArray(document.urls)) {
        urls.push(...document.urls.filter(url => url && url.trim() !== ''));
    }
    
    // Remove duplicates
    return [...new Set(urls)];
}

// Helper function to get primary file URL (first available)
export function getPrimaryFileUrl(document: DocumentLocation): string | null {
    const urls = getDocumentFileUrls(document);
    return urls.length > 0 ? urls[0] : null;
}

// Helper function to get file count
export function getDocumentFileCount(document: DocumentLocation): number {
    return getDocumentFileUrls(document).length;
}

// Helper function to get file name from URL
export function getDocumentFileName(document: DocumentLocation): string | null {
    const primaryUrl = getPrimaryFileUrl(document);
    if (!primaryUrl) return null;
    
    try {
        const url = new URL(primaryUrl);
        const pathname = url.pathname;
        const fileName = pathname.split('/').pop();
        return fileName || null;
    } catch {
        // If URL parsing fails, try to extract filename from the end of the string
        const parts = primaryUrl.split('/');
        return parts[parts.length - 1] || null;
    }
}

// Helper function to get all file names
export function getDocumentFileNames(document: DocumentLocation): string[] {
    const urls = getDocumentFileUrls(document);
    return urls.map(url => {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const fileName = pathname.split('/').pop();
            return fileName || url;
        } catch {
            const parts = url.split('/');
            return parts[parts.length - 1] || url;
        }
    }).filter(name => name !== null);
}

// Helper function to get file extension from URL
export function getDocumentFileExtension(document: DocumentLocation): string | null {
    const fileName = getDocumentFileName(document);
    if (!fileName) return null;
    
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) return null;
    
    return fileName.substring(lastDotIndex + 1).toLowerCase();
}

// Helper function to get all file extensions
export function getDocumentFileExtensions(document: DocumentLocation): string[] {
    const fileNames = getDocumentFileNames(document);
    return fileNames.map(fileName => {
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex === -1) return null;
        return fileName.substring(lastDotIndex + 1).toLowerCase();
    }).filter(ext => ext !== null) as string[];
}

// Helper function to check if document is recently updated (within last 7 days)
export function isRecentlyUpdated(document: DocumentLocation): boolean {
    if (!document.last_updated) return false;
    
    const updatedDate = new Date(document.last_updated);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return updatedDate > weekAgo;
}

// Helper function to format last updated date
export function getFormattedLastUpdated(document: DocumentLocation): string {
    if (!document.last_updated) return 'Never';
    
    const date = new Date(document.last_updated);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to generate display name for document
export function getDocumentDisplayName(document: DocumentLocation): string {
    if (document.document_label && document.document_label.trim() !== '') {
        return document.document_label;
    }
    
    const fileName = getDocumentFileName(document);
    if (fileName) {
        return fileName;
    }
    
    return document.description.length > 50 
        ? `${document.description.substring(0, 50)}...`
        : document.description;
}

// Helper function to validate document data
export function validateDocumentLocation(document: Partial<DocumentLocation>): string[] {
    const errors: string[] = [];
    
    if (!document.description || document.description.trim() === '') {
        errors.push('Description is required');
    }
    
    if (document.description && document.description.length > 1000) {
        errors.push('Description must be less than 1000 characters');
    }
    
    if (document.document_label && document.document_label.length > 255) {
        errors.push('Document label must be less than 255 characters');
    }
    
    return errors;
}
