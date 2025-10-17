import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/app/utils/supabase/admin';

// List of allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/jpg', 
  'image/png'
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 5;

interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  filePath?: string;
  error?: string;
  originalName?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Server: Starting multiple file upload process...');
    
    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userId = parseInt(formData.get('userId') as string);

    console.log('📋 Server: Upload request details:', {
      fileCount: files.length,
      userId
    });

    // Validate required fields
    if (!files.length || !userId) {
      console.error('❌ Server: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: files or userId' },
        { status: 400 }
      );
    }

    // Validate file count
    if (files.length > MAX_FILES_PER_REQUEST) {
      console.error(`❌ Server: Too many files: ${files.length}`);
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES_PER_REQUEST} files allowed per request` },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Server: Missing required environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create admin Supabase client
    const supabase = createAdminClient();

    // Test bucket access
    console.log('🔍 Server: Testing bucket access...');
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('document-files');
    
    if (bucketError) {
      console.error('❌ Server: Bucket access failed:', bucketError);
      return NextResponse.json(
        { success: false, error: `Storage bucket access failed: ${bucketError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Server: Bucket access successful:', bucketData?.name);

    // Process each file
    const uploadResults: UploadResult[] = [];
    const uploadPromises = files.map(async (file, index) => {
      try {
        console.log(`📎 Processing file ${index + 1}/${files.length}: ${file.name}`);

        // Validate individual file
        if (file.size > MAX_FILE_SIZE) {
          return {
            success: false,
            error: `File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
            originalName: file.name
          };
        }

        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
          return {
            success: false,
            error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
            originalName: file.name
          };
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return {
            success: false,
            error: `File MIME type not allowed: ${file.type}`,
            originalName: file.name
          };
        }

        // Generate unique filename
        const uniqueFileName = `${userId}_${uuidv4()}.${fileExtension}`;
        const filePath = `${userId}/${uniqueFileName}`;

        // Convert File to ArrayBuffer for upload
        const fileBuffer = await file.arrayBuffer();
        const fileUint8Array = new Uint8Array(fileBuffer);

        // Upload file to storage
        console.log(`⏰ Upload started for ${file.name}:`, new Date().toISOString());
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('document-files')
          .upload(filePath, fileUint8Array, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError || !uploadData) {
          console.error(`❌ Upload failed for ${file.name}:`, uploadError);
          return {
            success: false,
            error: `Upload failed: ${uploadError?.message || 'Unknown upload error'}`,
            originalName: file.name
          };
        }

        // Get public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('document-files')
          .getPublicUrl(uploadData.path);

        if (!publicUrlData?.publicUrl) {
          console.error(`❌ Failed to get public URL for ${file.name}`);
          
          // Clean up uploaded file
          await supabase.storage
            .from('document-files')
            .remove([uploadData.path]);
            
          return {
            success: false,
            error: 'Failed to generate public URL for uploaded file',
            originalName: file.name
          };
        }

        console.log(`✅ Upload completed for ${file.name}:`, publicUrlData.publicUrl);

        return {
          success: true,
          fileUrl: publicUrlData.publicUrl,
          fileName: uniqueFileName,
          filePath: uploadData.path,
          originalName: file.name
        };

      } catch (error) {
        console.error(`❌ Unexpected error processing ${file.name}:`, error);
        return {
          success: false,
          error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          originalName: file.name
        };
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Separate successful and failed uploads
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`📊 Upload summary: ${successful.length} successful, ${failed.length} failed`);

    // Return results
    return NextResponse.json({
      success: successful.length > 0,
      totalFiles: files.length,
      successfulUploads: successful.length,
      failedUploads: failed.length,
      results: results,
      successfulFiles: successful.map(r => ({
        url: r.fileUrl,
        fileName: r.fileName,
        originalName: r.originalName,
        filePath: r.filePath
      })),
      errors: failed.map(r => ({
        fileName: r.originalName,
        error: r.error
      }))
    });

  } catch (error) {
    console.error('❌ Server: Unexpected error in multi-upload:', error);
    return NextResponse.json(
      { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
