import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase admin client with SERVICE_ROLE_KEY
    // Log the environment variables (excluding the actual values for security)
    console.log("Supabase URL available:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Service Role Key available:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // For debugging - test if we can create a client with the anon key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use anon key instead for now
    );
    
    // Handle form data - parse it once with detailed error logging
    let formData;
    try {
      formData = await request.formData();
      console.log("Form data keys:", [...formData.keys()]);
    } catch (error) {
      console.error("Error parsing form data:", error);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse form data',
      }, { status: 400 });
    }

    const userId = formData.get('userId');
    console.log("User ID from form data:", userId);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID not provided',
      }, { status: 400 });
    }

    // Get the current user from the database directly using the provided ID
    const { data: userData, error: userQueryError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userQueryError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Handle file upload - use the same formData instance
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      }, { status: 400 });
    }

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, GIF or WebP image.',
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'File size exceeds 5MB limit',
      }, { status: 400 });
    }

    // Convert the file to a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use a consistent filename for profile pictures - this ensures we replace the old one
    const fileExt = file.name.split('.').pop();
    const fileName = `profile_picture.${fileExt}`; // Use consistent filename that will be overwritten
    const filePath = `${userData.id}/${fileName}`; // Store in user-specific folder with a fixed filename

    // Check if user already has a profile picture and delete all previous files in their folder
    try {
      // List all files in the user's profile directory
      const { data: existingFiles } = await supabase
        .storage
        .from('profile_images')
        .list(`${userData.id}`);
      
      console.log('Existing files in user directory:', existingFiles);
      
      // If there are existing files, remove them
      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map(file => `${userData.id}/${file.name}`);
        console.log('Removing existing profile pictures:', filesToRemove);
        
        const { error: removeError } = await supabase
          .storage
          .from('profile_images')
          .remove(filesToRemove);
          
        if (removeError) {
          console.warn('Error removing old profile pictures:', removeError);
          // Continue with upload even if deletion fails
        }
      }
    } catch (error) {
      console.warn('Error checking for existing profile pictures:', error);
      // Continue with upload even if check fails
    }

    // Upload to Supabase Storage using the correct bucket name: profile_images
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('profile_images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Update if exists
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      console.error('Upload attempted with path:', filePath);
      console.error('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        extension: fileExt,
        bucket: 'profile_images',
      });
      return NextResponse.json({
        success: false,
        error: `Failed to upload file to storage: ${uploadError.message}`,
        path: filePath,
      }, { status: 500 });
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('profile_images')
      .getPublicUrl(filePath);

    // Update user record with profile image URL
    const { error: updateError } = await supabase
      .from('users')
      .update({
        profile_img_url: publicUrl,
      })
      .eq('id', userData.id);

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update user profile',
      }, { status: 500 });
    }

    console.log('Profile image uploaded successfully to:', filePath);
    console.log('Public URL:', publicUrl);
    
    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    // Return more detailed error information for debugging
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error processing the request',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
