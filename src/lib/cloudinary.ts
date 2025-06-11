
import { v2 as cloudinaryV2, type ConfigOptions } from 'cloudinary';

let cloudinaryInstance: typeof cloudinaryV2 | null = null;
let cloudinaryConfigError: string | null = null;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const errors: string[] = [];
if (!cloudName) {
  errors.push('CLOUDINARY_CLOUD_NAME is not set.');
}
if (!apiKey) {
  errors.push('CLOUDINARY_API_KEY is not set.');
}
if (!apiSecret) {
  errors.push('CLOUDINARY_API_SECRET is not set.');
}

if (errors.length > 0) {
  cloudinaryConfigError = `Cloudinary configuration error: ${errors.join(' ')} Image uploads will fail.`;
  console.error(`[Cloudinary Lib] ${cloudinaryConfigError}`);
} else {
  try {
    cloudinaryV2.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    cloudinaryInstance = cloudinaryV2;
    console.log('[Cloudinary Lib] Configured successfully.');
  } catch (e: any) {
    cloudinaryConfigError = `Failed to configure Cloudinary during init: ${e.message}`;
    console.error(`[Cloudinary Lib] ${cloudinaryConfigError}`);
  }
}

export { cloudinaryInstance, cloudinaryConfigError };
