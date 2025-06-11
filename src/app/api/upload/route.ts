
import { NextResponse, type NextRequest } from 'next/server';
import { cloudinaryInstance, cloudinaryConfigError } from '@/lib/cloudinary';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  console.log('[API /api/upload] Received POST request');

  if (cloudinaryConfigError || !cloudinaryInstance) {
    const errorMsg = cloudinaryConfigError || 'Cloudinary service is not initialized on the server.';
    console.error(`[API /api/upload] Aborting: Cloudinary not configured. Error: ${errorMsg}`);
    return NextResponse.json({ message: 'Image upload service is not configured correctly on the server.', error: errorMsg }, { status: 503 }); // 503 Service Unavailable
  }

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.log('[API /api/upload] Unauthorized access attempt.');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  console.log('[API /api/upload] User authenticated:', session.user.email);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    console.log('[API /api/upload] No file provided in formData.');
    return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
  }
  console.log(`[API /api/upload] File received: ${file.name}, type: ${file.type}, size: ${file.size}`);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  console.log('[API /api/upload] File converted to buffer.');

  try {
    console.log('[API /api/upload] Attempting to upload to Cloudinary...');
    const uploadResult = await new Promise<{ secure_url: string; public_id: string } | undefined>((resolve, reject) => {
      const stream = cloudinaryInstance.uploader.upload_stream( // Use cloudinaryInstance
        {
          resource_type: 'image',
          folder: 'lodger_properties',
        },
        (error, result) => {
          if (error) {
            console.error('[API /api/upload] Cloudinary Upload Stream Error:', error);
            reject(error); // This rejection should be caught by the outer try...catch
          } else {
            console.log('[API /api/upload] Cloudinary Upload Stream Success Result:', result);
            resolve(result as { secure_url: string; public_id: string } | undefined);
          }
        }
      );
      stream.end(buffer);
    });

    if (uploadResult?.secure_url) {
      console.log('[API /api/upload] Image uploaded successfully. URL:', uploadResult.secure_url);
      return NextResponse.json({
        message: 'Image uploaded successfully',
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      }, { status: 200 });
    } else {
      console.error('[API /api/upload] Cloudinary upload failed to return a secure URL. Full result:', uploadResult);
      // This case might happen if Cloudinary returns a 200 OK but the result format is unexpected
      throw new Error('Cloudinary upload succeeded but response was malformed or lacked secure_url.');
    }

  } catch (error: any) {
    console.error('[API /api/upload] Overall Upload API Error (after buffer conversion):', error);
    let errorMessage = 'Image upload failed due to a server error.';
    if (error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'object' && error.http_code) {
        errorMessage = `Cloudinary error: ${error.http_code} - ${error.message}`;
    }
    return NextResponse.json({ message: 'Image upload failed.', error: errorMessage }, { status: 500 });
  }
}
