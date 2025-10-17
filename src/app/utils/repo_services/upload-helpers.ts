interface UploadFileResult {
    success: boolean;
    url?: string;
    error?: string;
    fileName?: string;
}

interface DeleteFileResult {
    success: boolean;
    error?: string;
    filePath?: string;
}

/**
 * Upload file using server-side API route (file only)
 */
export const uploadFileToServer = async (file: File, userId: number): Promise<UploadFileResult> => {
    try {
        console.log('🔄 Client: Starting file upload for user:', userId);
        console.log('📁 Client: File details:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // Create form data for server upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId.toString());
        
        console.log('📤 Client: Sending upload request to server...');
        console.log('⏰ Client: Upload started at:', new Date().toISOString());
        
        const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
        });
        
        console.log('⏰ Client: Upload response received at:', new Date().toISOString());
        console.log('📊 Client: Response status:', response.status);
        
        const result = await response.json();
        console.log('📋 Client: Upload result:', result);
        
        if (!response.ok || !result.success) {
            console.error('❌ Client: Upload failed:', result.error);
            return {
                success: false,
                error: result.error || `Upload failed with status ${response.status}`
            };
        }
        
        console.log('✅ Client: File uploaded successfully:', result.fileUrl);
        
        return {
            success: true,
            url: result.fileUrl,
            fileName: result.fileName
        };
        
    } catch (error) {
        console.error('❌ Client: Upload error:', error);
        return {
            success: false,
            error: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};

/**
 * Delete file using server-side API route
 */
export const deleteFileFromServer = async (fileUrl: string): Promise<DeleteFileResult> => {
    try {
        console.log('🗑️ Client: Starting file deletion...');
        console.log('📁 Client: File URL to delete:', fileUrl);
        
        console.log('📤 Client: Sending delete request to server...');
        console.log('⏰ Client: Delete started at:', new Date().toISOString());
        
        const response = await fetch(`/api/documents/delete?fileUrl=${encodeURIComponent(fileUrl)}`, {
            method: 'DELETE',
        });
        
        console.log('⏰ Client: Delete response received at:', new Date().toISOString());
        console.log('📊 Client: Response status:', response.status);
        
        const result = await response.json();
        console.log('📋 Client: Delete result:', result);
        
        if (!response.ok || !result.success) {
            console.error('❌ Client: Delete failed:', result.error);
            return {
                success: false,
                error: result.error || `Delete failed with status ${response.status}`
            };
        }
        
        console.log('✅ Client: File deleted successfully');
        
        return {
            success: true,
            filePath: result.filePath
        };
        
    } catch (error) {
        console.error('❌ Client: Delete error:', error);
        return {
            success: false,
            error: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};
