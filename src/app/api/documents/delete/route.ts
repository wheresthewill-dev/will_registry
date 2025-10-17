import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/app/utils/supabase/admin';

export async function DELETE(request: NextRequest) {
    try {
        console.log('🗑️ Server: Starting file deletion process...');
        
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('fileUrl');
        
        if (!fileUrl) {
            console.error('❌ Server: No file URL provided');
            return NextResponse.json({
                success: false,
                error: 'File URL is required'
            }, { status: 400 });
        }
        
        console.log('📁 Server: File URL to delete:', fileUrl);
        
        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('❌ Server: Missing required environment variables');
            return NextResponse.json({
                success: false,
                error: 'Server configuration error'
            }, { status: 500 });
        }

        // Create admin Supabase client with service role key for storage access
        const supabase = createAdminClient();
        
        // Extract file path from URL
        const url = new URL(fileUrl);
        const pathSegments = url.pathname.split('/');
        const bucketIndex = pathSegments.findIndex(segment => segment === 'document-files');
        
        if (bucketIndex === -1 || bucketIndex === pathSegments.length - 1) {
            console.error('❌ Server: Could not extract file path from URL:', fileUrl);
            return NextResponse.json({
                success: false,
                error: 'Invalid file URL format'
            }, { status: 400 });
        }
        
        const filePath = pathSegments.slice(bucketIndex + 1).join('/');
        console.log('📁 Server: Extracted file path:', filePath);
        
        // Test bucket access first
        console.log('🔍 Server: Testing bucket access...');
        const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('document-files');
        
        if (bucketError) {
            console.error('❌ Server: Bucket access failed:', bucketError);
            return NextResponse.json({
                success: false,
                error: `Storage bucket access failed: ${bucketError.message}`
            }, { status: 500 });
        }
        
        console.log('✅ Server: Bucket access successful:', bucketData?.name);
        
        // Delete the file from Supabase Storage
        console.log('🗑️ Server: Deleting file from storage...');
        const { error: deleteError } = await supabase.storage
            .from('document-files')
            .remove([filePath]);
        
        if (deleteError) {
            console.error('❌ Server: File deletion failed:', deleteError);
            return NextResponse.json({
                success: false,
                error: `File deletion failed: ${deleteError.message}`
            }, { status: 500 });
        }
        
        console.log('✅ Server: File deleted successfully');
        
        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
            filePath: filePath
        });
        
    } catch (error) {
        console.error('❌ Server: Delete error:', error);
        return NextResponse.json({
            success: false,
            error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
    }
}
