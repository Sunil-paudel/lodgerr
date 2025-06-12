
import { NextResponse, type NextRequest } from 'next/server';
import { cloudinaryInstance, cloudinaryConfigError } from '@/lib/cloudinary';
import { Readable } from 'stream';

// Helper function to convert NextRequest stream to Node.js Readable stream
async function requestToStream(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get reader from request body');
  }

  return new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null); // Signal end of stream
      } else {
        this.push(value);
      }
    },
  });
}


export async function POST(request: NextRequest) {
  if (cloudinaryConfigError) {
    console.error('[API Upload] Cloudinary config error:', cloudinaryConfigError);
    return NextResponse.json({ message: "Image upload service is not configured correctly.", error: cloudinaryConfigError }, { status: 503 });
  }

  if (!cloudinaryInstance) {
    console.error('[API Upload] Cloudinary instance not available.');
    return NextResponse.json({ message: "Image upload service is unavailable.", error: "Cloudinary instance not initialized." }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ message: 'Cannot upload an empty file.'}, { status: 400 });
    }
    
    // Convert File to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use a Promise to handle the stream upload
    const uploadResponse = await new Promise<{ secure_url?: string; public_id?: string; error?: any }>((resolve, reject) => {
      const uploadStream = cloudinaryInstance!.uploader.upload_stream(
        { resource_type: 'image' }, // You can add more options like folder, tags, etc.
        (error, result) => {
          if (error) {
            console.error('[API Upload] Cloudinary upload error:', error);
            return reject({ error });
          }
          if (!result) {
            console.error('[API Upload] Cloudinary returned no result.');
            return reject({ error: new Error('Cloudinary returned no result after upload.') });
          }
          return resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      
      // Create a new Readable stream from the buffer and pipe it
      Readable.from(buffer).pipe(uploadStream);
    });

    if (uploadResponse.error || !uploadResponse.secure_url) {
      const errorMessage = uploadResponse.error?.message || 'Unknown Cloudinary upload error.';
      return NextResponse.json({ message: 'Failed to upload image.', error: errorMessage }, { status: 500 });
    }
    
    console.log('[API Upload] File uploaded successfully to Cloudinary:', uploadResponse.secure_url);
    return NextResponse.json({ 
      message: 'File uploaded successfully', 
      imageUrl: uploadResponse.secure_url,
      publicId: uploadResponse.public_id 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API Upload] Error processing upload request:', error);
    let errorMessage = 'An unexpected error occurred during file upload.';
     if (error.message) {
        errorMessage = error.message;
    }
    // Check for specific error types if needed, e.g., body parsing errors
    if (error.type === 'entity.too.large') { // Example, check actual error types from Next.js/Node
        errorMessage = 'File size exceeds server limit.';
        return NextResponse.json({ message: errorMessage, error: 'FileTooLarge' }, { status: 413 }); // Payload Too Large
    }
    return NextResponse.json({ message: 'Upload failed due to a server error.', error: errorMessage }, { status: 500 });
  }
}
