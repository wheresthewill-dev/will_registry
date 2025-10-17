import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';
import { DocumentLocation } from '@/app/utils/repo_services/interfaces/document_location';

// Create service role client for server-side operations
const supabaseServiceRole = createAdminClient();

export async function POST(request: NextRequest) {
  console.log('📝 POST /api/documents/by-user - Starting request processing');
  
  try {
    // Get the request body
    const contentType = request.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);
    let body: any;
    
    if (contentType && contentType.includes('application/json')) {
      const text = await request.text();
      console.log('📄 Request body text:', text);
      
      if (text.trim() === '') {
        console.warn('⚠️ Request body is empty');
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      
      try {
        body = JSON.parse(text);
        console.log('✅ Parsed JSON body:', body);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    } else {
      console.error('❌ Invalid content type');
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const { user_id } = body;

    // Validate required fields
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Validate user_id is a number
    const userId = typeof user_id === 'string' ? parseInt(user_id) : user_id;
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'user_id must be a valid number' },
        { status: 400 }
      );
    }

    // Query document locations for the specified user
    const { data: documents, error } = await supabaseServiceRole
      .from('document_locations')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Database error fetching document locations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch document locations', details: error.message },
        { status: 500 }
      );
    }

    // Return the documents list
    return NextResponse.json({
      success: true,
      documents: documents as DocumentLocation[],
      count: documents?.length || 0
    });

  } catch (error) {
    console.error('Error in document locations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract user_id from query parameters for GET requests
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    // Validate required fields
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
        { status: 400 }
      );
    }

    // Validate user_id is a number
    const userId = parseInt(user_id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'user_id must be a valid number' },
        { status: 400 }
      );
    }

    // Query document locations for the specified user
    const { data: documents, error } = await supabaseServiceRole
      .from('document_locations')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Database error fetching document locations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch document locations', details: error.message },
        { status: 500 }
      );
    }

    // Return the documents list
    return NextResponse.json({
      success: true,
      documents: documents as DocumentLocation[],
      count: documents?.length || 0
    });

  } catch (error) {
    console.error('Error in document locations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
