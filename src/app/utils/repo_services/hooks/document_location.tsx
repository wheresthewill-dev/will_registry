import { DocumentLocation, validateDocumentLocation } from "../interfaces/document_location";
import { useSupabaseData } from "../supabase_data";
import { useUserSession } from "./useUserSession";
import { uploadFileToServer, deleteFileFromServer } from "../upload-helpers";
import { useCallback, useMemo } from "react";

interface CreateDocumentLocationData {
    description: string;
    document_label?: string;
    file?: File;
    files?: File[]; // New: support multiple files
}

interface UpdateDocumentLocationData {
    description?: string;
    document_label?: string;
    file?: File;
    files?: File[]; // New: support multiple files
    replaceAllFiles?: boolean; // Whether to replace all existing files or add to them
    urls?: string[]; // Explicit list of URLs to keep (for file deletion)
}

interface CreateDocumentLocationResult {
    success: boolean;
    document?: DocumentLocation;
    error?: string;
}

interface UpdateDocumentLocationResult {
    success: boolean;
    document?: DocumentLocation;
    error?: string;
}

interface FileUploadResult {
    success: boolean;
    url?: string;
    error?: string;
    fileName?: string;
}

interface MultiFileUploadResult {
    success: boolean;
    successfulFiles?: Array<{
        url: string;
        fileName: string;
        originalName: string;
        filePath: string;
    }>;
    errors?: Array<{
        fileName: string;
        error: string;
    }>;
    totalFiles?: number;
    successfulUploads?: number;
    failedUploads?: number;
}

export function useDocumentLocations() {
    const { userId, userLoading, userProfile } = useUserSession();

    // Memoize the filter to prevent recreation on every render
    const customFilter = useMemo(() => {
        if (userId) {
            return {
                column: 'user_id',
                value: userId,
                operator: 'eq' as const
            };
        } else {
            // When no user is found, use an impossible filter to return no results
            return {
                column: 'user_id',
                value: -1, // No user will have ID -1
                operator: 'eq' as const
            };
        }
    }, [userId]);

    // Memoize the orderBy to prevent recreation
    const orderBy = useMemo(() => ({
        column: 'last_updated' as const,
        ascending: false as const
    }), []);

    const result = useSupabaseData<DocumentLocation>({
        table: 'document_locations',
        customFilter,
        realtime: false,
        orderBy,
        enabled: userId !== null && !userLoading // Only fetch when we have a userId and not loading
    });

    // Transform the data to ensure IDs are strings and URLs are arrays
    // Only transform data if we have a valid user
    const transformedData = userId ? result.data.map(doc => ({
        ...doc,
        id: doc.id.toString(),
        urls: Array.isArray(doc.urls) ? doc.urls : [] // Ensure urls is always an array
    })) : [];

    /**
     * Upload multiple files using server-side API
     */
    const uploadMultipleFiles = async (files: File[], userId: number): Promise<MultiFileUploadResult> => {
        try {
            console.log('🔄 Client: Starting multiple file upload...');

            if (files.length === 0) {
                return { success: false, errors: [{ fileName: 'None', error: 'No files provided' }] };
            }

            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            formData.append('userId', userId.toString());

            const response = await fetch('/api/documents/upload-multiple', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Client: Multiple file upload completed:', result);

            return result;

        } catch (error) {
            console.error('❌ Client: Multiple file upload error:', error);
            return {
                success: false,
                errors: [{ fileName: 'Upload', error: error instanceof Error ? error.message : 'Unknown error' }]
            };
        }
    };

    /**
     * Upload file using server-side API
     */
    const uploadDocumentFile = async (file: File, userId: number): Promise<FileUploadResult> => {
        return await uploadFileToServer(file, userId);
    };


    /**
     * Delete file from Supabase Storage using server-side API
     */
    const deleteDocumentFile = async (fileUrl: string): Promise<boolean> => {
        try {
            console.log('🗑️ Client: Starting file deletion via server API...');

            const result = await deleteFileFromServer(fileUrl);

            if (!result.success) {
                console.error('❌ Client: Server-side delete failed:', result.error);
                return false;
            }

            console.log('✅ Client: File deleted successfully via server');
            return true;

        } catch (error) {
            console.error('❌ Client: File deletion error:', error);
            return false;
        }
    };

    // Document-specific helper functions
    const getDocumentsByUserId = (targetUserId?: number) => {
        const filterUserId = targetUserId || userId;
        return transformedData.filter(doc => doc.user_id === filterUserId);
    };

    const getDocumentsWithFiles = () => {
        return transformedData.filter(doc => doc.url && doc.url.trim() !== '');
    };

    const getDocumentsWithoutFiles = () => {
        return transformedData.filter(doc => !doc.url || doc.url.trim() === '');
    };

    const getDocumentById = (id: string): DocumentLocation | undefined => {
        return transformedData.find(doc => doc.id === id);
    };

    const searchDocuments = (query: string) => {
        const lowercaseQuery = query.toLowerCase();
        return transformedData.filter(doc =>
            doc.description.toLowerCase().includes(lowercaseQuery) ||
            (doc.document_label && doc.document_label.toLowerCase().includes(lowercaseQuery))
        );
    };

    // CRUD operations
    const createDocumentLocation = async (documentData: CreateDocumentLocationData): Promise<CreateDocumentLocationResult> => {
        try {
            // Get current user
            const currentUser = userProfile;
            if (!currentUser) {
                return {
                    success: false,
                    error: "No current user found"
                };
            }

            console.log('🔄 Starting document location creation process...');

            // Validate document data
            const validationErrors = validateDocumentLocation({
                description: documentData.description,
                document_label: documentData.document_label
            });

            if (validationErrors.length > 0) {
                return {
                    success: false,
                    error: `Validation failed: ${validationErrors.join(', ')}`
                };
            }

            let fileUrls: string[] = [];

            // Handle single file upload (backward compatibility)
            if (documentData.file) {
                console.log('📎 Single file provided, uploading...');
                const uploadResult = await uploadDocumentFile(documentData.file, parseInt(currentUser.id));

                if (!uploadResult.success) {
                    return {
                        success: false,
                        error: uploadResult.error || 'File upload failed'
                    };
                }

                fileUrls.push(uploadResult.url!);
                console.log('✅ Single file uploaded successfully:', uploadResult.url);
            }

            // Handle multiple files upload
            if (documentData.files && documentData.files.length > 0) {
                console.log('📎 Multiple files provided, uploading...');
                const uploadResult = await uploadMultipleFiles(documentData.files, parseInt(currentUser.id));

                if (!uploadResult.success || !uploadResult.successfulFiles) {
                    return {
                        success: false,
                        error: uploadResult.errors?.[0]?.error || 'Multiple file upload failed'
                    };
                }

                fileUrls.push(...uploadResult.successfulFiles.map(f => f.url));
                console.log('✅ Multiple files uploaded successfully:', uploadResult.successfulFiles.length);
            }

            // Create document location record
            const documentRecord = {
                user_id: parseInt(currentUser.id),
                description: documentData.description,
                document_label: documentData.document_label || null,
                url: fileUrls.length > 0 ? fileUrls[0] : null, // Legacy field - use first URL
                urls: fileUrls, // New multiple URLs field
                last_updated: new Date().toISOString()
            };

            console.log('🔄 Creating document location record...');
            const createdDocument = await result.create(documentRecord);

            if (!createdDocument) {
                console.error('❌ Failed to create document location record');

                // Clean up uploaded files if document creation failed
                if (fileUrls.length > 0) {
                    console.log('🗑️ Cleaning up uploaded files due to document creation failure...');
                    for (const url of fileUrls) {
                        await deleteDocumentFile(url);
                    }
                }

                return {
                    success: false,
                    error: "Failed to create document location record"
                };
            }

            console.log('✅ Document location created successfully');

            return {
                success: true,
                document: createdDocument
            };

        } catch (error) {
            console.error('❌ Failed to create document location:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred"
            };
        }
    };

    const updateDocumentLocation = async (documentId: string, updates: UpdateDocumentLocationData): Promise<UpdateDocumentLocationResult> => {
        try {
            console.log('🔄 Starting document location update process...');

            // Get current document
            const currentDocument = getDocumentById(documentId);
            if (!currentDocument) {
                return {
                    success: false,
                    error: "Document not found"
                };
            }

            // Validate updates if provided
            if (updates.description !== undefined || updates.document_label !== undefined) {
                const validationErrors = validateDocumentLocation({
                    description: updates.description || currentDocument.description,
                    document_label: updates.document_label !== undefined ? updates.document_label : currentDocument.document_label
                });

                if (validationErrors.length > 0) {
                    return {
                        success: false,
                        error: `Validation failed: ${validationErrors.join(', ')}`
                    };
                }
            }

            let newFileUrls: string[] = [];
            let oldFileUrls: string[] = [];
            let filesToDelete: string[] = [];

            // Get current file URLs
            if (currentDocument.urls && Array.isArray(currentDocument.urls)) {
                oldFileUrls = [...currentDocument.urls];
            } else if (currentDocument.url) {
                oldFileUrls = [currentDocument.url];
            }

            // If the update explicitly provides new URLs list, use that instead of old URLs
            if (updates.urls !== undefined) {
                // Determine which files should be deleted (files in oldFileUrls but not in updates.urls)
                filesToDelete = oldFileUrls.filter(url => !updates.urls!.includes(url));
                
                // Start with the explicitly provided URLs
                newFileUrls = [...updates.urls];
            } else {
                // Otherwise start with existing URLs
                newFileUrls = [...oldFileUrls];
            }

            // Handle single file update (backward compatibility)
            if (updates.file) {
                console.log('📎 Single file provided, uploading...');

                const uploadResult = await uploadDocumentFile(updates.file, currentDocument.user_id);

                if (!uploadResult.success) {
                    return {
                        success: false,
                        error: uploadResult.error || 'File upload failed'
                    };
                }

                if (updates.replaceAllFiles) {
                    // If replacing all files, mark old ones for deletion
                    filesToDelete = [...oldFileUrls];
                    newFileUrls = [uploadResult.url!];
                } else {
                    // Otherwise add to existing files
                    newFileUrls.push(uploadResult.url!);
                }
                console.log('✅ Single file uploaded successfully:', uploadResult.url);
            }

            // Handle multiple files update
            if (updates.files && updates.files.length > 0) {
                console.log('📎 Multiple files provided, uploading...');

                const uploadResult = await uploadMultipleFiles(updates.files, currentDocument.user_id);

                if (!uploadResult.success || !uploadResult.successfulFiles) {
                    return {
                        success: false,
                        error: uploadResult.errors?.[0]?.error || 'Multiple file upload failed'
                    };
                }

                const uploadedUrls = uploadResult.successfulFiles.map(f => f.url);
                
                if (updates.replaceAllFiles) {
                    // If replacing all files, mark old ones for deletion
                    filesToDelete = [...oldFileUrls];
                    newFileUrls = uploadedUrls;
                } else {
                    // Otherwise add to existing files
                    newFileUrls.push(...uploadedUrls);
                }
                console.log('✅ Multiple files uploaded successfully:', uploadResult.successfulFiles.length);
            }

            // Prepare update data
            const updateData: Partial<DocumentLocation> = {
                last_updated: new Date().toISOString()
            };

            if (updates.description !== undefined) {
                updateData.description = updates.description;
            }

            if (updates.document_label !== undefined) {
                updateData.document_label = updates.document_label;
            }

            // Update URL fields
            updateData.url = newFileUrls.length > 0 ? newFileUrls[0] : null; // Legacy field
            updateData.urls = newFileUrls; // New multiple URLs field

            console.log('🔄 Updating document location record...');
            const updateSuccess = await result.update(documentId, updateData);

            if (!updateSuccess) {
                console.error('❌ Failed to update document location record');

                // Clean up newly uploaded files if update failed
                const newlyUploadedUrls = newFileUrls.filter(url => !oldFileUrls.includes(url));
                if (newlyUploadedUrls.length > 0) {
                    console.log('🗑️ Cleaning up newly uploaded files due to update failure...');
                    for (const url of newlyUploadedUrls) {
                        await deleteDocumentFile(url);
                    }
                }

                return {
                    success: false,
                    error: "Failed to update document location record"
                };
            }

            // Get the updated document
            const updatedDocument = getDocumentById(documentId);
            if (!updatedDocument) {
                console.error('❌ Could not retrieve updated document');
                return {
                    success: false,
                    error: "Could not retrieve updated document"
                };
            }

            // Clean up deleted files after successful update
            if (filesToDelete.length > 0) {
                console.log(`🗑️ Cleaning up ${filesToDelete.length} deleted files...`);
                for (const url of filesToDelete) {
                    await deleteDocumentFile(url);
                }
            }

            console.log('✅ Document location updated successfully');

            return {
                success: true,
                document: updatedDocument
            };

        } catch (error) {
            console.error('❌ Failed to update document location:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred"
            };
        }
    };

    const deleteDocumentLocation = async (documentId: string): Promise<boolean> => {
        try {
            console.log('🔄 Starting document location deletion process...');

            // Get document to access file URL for cleanup
            const document = getDocumentById(documentId);
            if (!document) {
                console.error('❌ Document not found for deletion');
                return false;
            }

            // Delete the database record first
            console.log('🗑️ Deleting document location record...');
            const deleteSuccess = await result.remove(documentId);

            if (!deleteSuccess) {
                console.error('❌ Failed to delete document location record');
                return false;
            }

            // Delete associated file if it exists
            if (document.url) {
                console.log('🗑️ Deleting associated file...');
                await deleteDocumentFile(document.url);
                // Note: We don't fail the operation if file deletion fails
                // The database record is already deleted
            }

            console.log('✅ Document location deleted successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to delete document location:', error);
            return false;
        }
    };

    // Original simple CRUD functions for backward compatibility
    const createDocumentLocationRecord = async (newDocument: Omit<DocumentLocation, 'id'>) => {
        return await result.create(newDocument);
    };

    const updateDocumentLocationRecord = async (documentId: string, updates: Partial<Omit<DocumentLocation, 'id'>>) => {
        return await result.update(documentId, updates);
    };

    const deleteDocumentLocationRecord = async (documentId: string) => {
        return await result.remove(documentId);
    };

     const getDocumentsForUser = useCallback(async (targetUserId: number) => {
            try {
                console.log(`🔍 Fetching documents for user ${targetUserId}`);
    
                const response = await fetch('/api/documents/by-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ user_id: targetUserId }),
                });
    
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ HTTP error! status: ${response.status}, body: ${errorText}`);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
    
                const result = await response.json();
                console.log(`📊 API response for user ${targetUserId}:`, result);
                
                if (result.success) {
                    console.log(`✅ Successfully fetched ${result.count} documents for user ${targetUserId}`);
                    return {
                        success: true,
                        documents: result.documents || [],
                        count: result.count || 0
                    };
                } else {
                    console.error(`❌ Failed to fetch documents for user ${targetUserId}:`, result.error);
                    return {
                        success: false,
                        error: result.error || 'Failed to fetch documents',
                        documents: [],
                        count: 0
                    };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Network error';
                console.error(`❌ Error fetching documents for user ${targetUserId}:`, error);
                
                return {
                    success: false,
                    error: errorMessage,
                    documents: [],
                    count: 0
                };
            }
        }, []); 

    return {
        ...result,
        // Override data to return empty array when no user
        data: userId ? transformedData : [],
        // Override loading state to include user loading
        loading: result.loading || userLoading || !userId,
        // Override error to include user errors
        error: result.error || undefined,
        // Helper functions
        getDocumentsByUser: getDocumentsByUserId,
        getDocumentsWithFiles,
        getDocumentsWithoutFiles,
        getDocumentById,
        searchDocuments,
        // CRUD operations with file handling
        createDocumentLocation,
        updateDocumentLocation,
        deleteDocumentLocation,
        // File operations
        uploadDocumentFile,
        uploadMultipleFiles,
        deleteDocumentFile,
        // Basic CRUD operations (backward compatibility)
        createDocumentLocationRecord,
        updateDocumentLocationRecord,
        deleteDocumentLocationRecord,
        getDocumentsForUser,
    };
}
