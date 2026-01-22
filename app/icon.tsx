import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '96px',
        }}
      >
        <span
          style={{
            fontSize: '280px',
            fontWeight: 'bold',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          N
        </span>
      </div>
    ),
    {
      ...size,
    }
  )
}
