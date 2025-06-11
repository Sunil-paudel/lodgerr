
import { NextResponse, type NextRequest } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  console.log('[API /api/upload] Received POST request');
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

  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  console.log('[API /api/upload] File converted to buffer.');

  try {
    console.log('[API /api/upload] Attempting to upload to Cloudinary...');
    const uploadResult = await new Promise<{ secure_url: string; public_id: string } | undefined>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image', 
          folder: 'lodger_properties', 
        },
        (error, result) => {
          if (error) {
            console.error('[API /api/upload] Cloudinary Upload Error:', error);
            reject(error);
          } else {
            console.log('[API /api/upload] Cloudinary Upload Success Result:', result);
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
      throw new Error('Cloudinary upload failed to return a secure URL.');
    }

  } catch (error: any) {
    console.error('[API /api/upload] Overall Upload API Error:', error);
    return NextResponse.json({ message: 'Image upload failed.', error: error.message || 'Unknown server error during upload' }, { status: 500 });
  }
}

