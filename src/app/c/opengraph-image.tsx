import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SnagIT — Log it. Fix it. Done.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(145deg, #0b2558 0%, #1A56DB 55%, #3b74e8 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle radial glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
          }}
        />
        {/* Subtle radial glow bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            left: -60,
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          }}
        />

        {/* App icon — exact icon.svg on white card so it reads against the blue bg */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 128,
            height: 128,
            background: 'white',
            borderRadius: 32,
            marginBottom: 36,
            boxShadow: '0 12px 40px rgba(0,0,0,0.30)',
          }}
        >
          <svg width="88" height="88" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="7" fill="#1A56DB"/>
            <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
            <circle cx="16" cy="16" r="2.5" fill="white"/>
            <line x1="16" y1="4"  x2="16" y2="9"  stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="4"  y1="16" x2="9"  y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: '-3px',
            lineHeight: 1,
            marginBottom: 22,
            display: 'flex',
          }}
        >
          <span style={{ color: 'white' }}>Snag</span>
          <span style={{ color: '#22C55E' }}>IT</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 34,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.78)',
            letterSpacing: '0.5px',
          }}
        >
          Log it. Assign it. Fixed.
        </div>

        {/* Domain badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 99,
            padding: '8px 20px',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: '#4ade80',
            }}
          />
          <span
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            snagitapp.co.za
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
