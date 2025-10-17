import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

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

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Server: Starting file upload process...');
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = parseInt(formData.get('userId') as string);

    console.log('📋 Server: Upload request details:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId
    });

    // Validate required fields
    if (!file || !userId) {
      console.error('❌ Server: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: file or userId' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error(`❌ Server: File too large: ${file.size} bytes`);
      return NextResponse.json(
        { success: false, error: `File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      console.error(`❌ Server: Invalid file extension: ${fileExtension}`);
      return NextResponse.json(
        { success: false, error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      console.error(`❌ Server: Invalid MIME type: ${file.type}`);
      return NextResponse.json(
        { success: false, error: `File MIME type not allowed: ${file.type}` },
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

    // Create admin Supabase client with service role key for storage access
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

    // Generate unique filename
    const uniqueFileName = `${userId}_${uuidv4()}.${fileExtension}`;
    const filePath = `${userId}/${uniqueFileName}`;

    console.log('📁 Server: Uploading file to path:', filePath);

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer();
    const fileUint8Array = new Uint8Array(fileBuffer);

    // Upload file to storage
    console.log('⏰ Server: Upload started at:', new Date().toISOString());
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('document-files')
      .upload(filePath, fileUint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    console.log('⏰ Server: Upload completed at:', new Date().toISOString());

    if (uploadError || !uploadData) {
      console.error('❌ Server: File upload failed:', uploadError);
      return NextResponse.json(
        { success: false, error: `File upload failed: ${uploadError?.message || 'Unknown upload error'}` },
        { status: 500 }
      );
    }

    console.log('✅ Server: File uploaded successfully:', uploadData.path);

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('document-files')
      .getPublicUrl(uploadData.path);

    if (!publicUrlData?.publicUrl) {
      console.error('❌ Server: Failed to get public URL');
      
      // Clean up uploaded file
      await supabase.storage
        .from('document-files')
        .remove([uploadData.path]);
        
      return NextResponse.json(
        { success: false, error: 'Failed to generate public URL for uploaded file' },
        { status: 500 }
      );
    }

    console.log('🔗 Server: Public URL generated:', publicUrlData.publicUrl);

    return NextResponse.json({
      success: true,
      fileUrl: publicUrlData.publicUrl,
      fileName: uniqueFileName,
      filePath: uploadData.path
    });

  } catch (error) {
    console.error('❌ Server: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
