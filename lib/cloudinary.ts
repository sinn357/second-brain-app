import { v2 as cloudinary } from 'cloudinary'

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Cloudinary 클라이언트 export
export default cloudinary

// 파일 업로드 헬퍼 함수
export async function uploadToCloudinary(
  file: Buffer,
  fileName: string,
  folder: string = 'second-brain'
): Promise<{ url: string; publicId: string; thumbnailUrl?: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // 자동으로 파일 타입 감지
        public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`,
      },
      (error, result) => {
        if (error) return reject(error)
        if (!result) return reject(new Error('Upload failed'))

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          thumbnailUrl: result.resource_type === 'image' ? result.secure_url : undefined,
        })
      }
    )

    uploadStream.end(file)
  })
}

// 파일 삭제 헬퍼 함수
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
