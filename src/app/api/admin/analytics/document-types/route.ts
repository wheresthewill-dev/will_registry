import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';
import { verifyAdminAccess } from '../utils';

const adminClient = createAdminClient();

// Helper function to extract file extension from URL
const extractFileExtension = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDotIndex = pathname.lastIndexOf('.');
    
    if (lastDotIndex !== -1) {
      return pathname.substring(lastDotIndex + 1).toLowerCase();
    }
    return null;
  } catch {
    // If URL parsing fails, try simple string approach
    const parts = url.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    // Fetch document types (based on file extensions)
    const { data: documents } = await adminClient
      .from('document_locations')
      .select('url, urls');

    // Extract file extensions from document URLs
    const extensionCounts: Record<string, number> = {};
    documents?.forEach(doc => {
      // Process legacy URL field
      if (doc.url) {
        const extension = extractFileExtension(doc.url);
        if (extension) {
          extensionCounts[extension] = (extensionCounts[extension] || 0) + 1;
        }
      }
      
      // Process new URLs array field
      if (doc.urls && Array.isArray(doc.urls)) {
        doc.urls.forEach(url => {
          const extension = extractFileExtension(url);
          if (extension) {
            extensionCounts[extension] = (extensionCounts[extension] || 0) + 1;
          }
        });
      }
    });

    // Format document types for chart display
    const documentTypeLabels = Object.keys(extensionCounts)
      .sort((a, b) => extensionCounts[b] - extensionCounts[a])
      .slice(0, 7); // Top 7 file types
    
    const documentTypeData = documentTypeLabels.map(ext => extensionCounts[ext]);

    return NextResponse.json({
      labels: documentTypeLabels,
      data: documentTypeData
    });
  } catch (error) {
    console.error('Error fetching document types analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
