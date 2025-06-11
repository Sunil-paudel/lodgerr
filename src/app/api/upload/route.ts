
import { NextResponse, type NextRequest } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
  }

  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const uploadResult = await new Promise<{ secure_url: string; public_id: string } | undefined>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image', // Explicitly set resource type
          folder: 'lodger_properties', // Optional: organize uploads into a folder
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            reject(error);
          } else {
            resolve(result as { secure_url: string; public_id: string } | undefined);
          }
        }
      ).end(buffer);
    });

    if (uploadResult?.secure_url) {
      return NextResponse.json({
        message: 'Image uploaded successfully',
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id, // Good to store if you want to delete/manage later
      }, { status: 200 });
    } else {
      throw new Error('Cloudinary upload failed to return a secure URL.');
    }

  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ message: 'Image upload failed.', error: error.message || 'Unknown error' }, { status: 500 });
  }
}
