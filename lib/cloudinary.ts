import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

export async function uploadImage(
  file: Buffer,
  options?: {
    folder?: string
    maxWidth?: number
    maxHeight?: number
  }
): Promise<UploadResult> {
  const { folder = 'second-brain', maxWidth = 1920, maxHeight = 1080 } = options || {}

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: maxWidth, height: maxHeight, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'))
            return
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          })
        }
      )
      .end(file)
  })
}

export async function uploadFile(
  file: Buffer,
  filename: string,
  options?: { folder?: string }
): Promise<UploadResult> {
  const { folder = 'second-brain/files' } = options || {}

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'raw',
          public_id: filename.replace(/\.[^/.]+$/, ''),
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'))
            return
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: 0,
            height: 0,
            format: result.format || '',
            bytes: result.bytes || 0,
          })
        }
      )
      .end(file)
  })
}

export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
