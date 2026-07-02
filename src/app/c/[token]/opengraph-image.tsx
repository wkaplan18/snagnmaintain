import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { token: string } }) {
  let contractorName = 'Contractor Portal'

  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/contractors?access_token=eq.${params.token}&select=name,company&limit=1`
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    })
    const data = await res.json()
    if (data?.[0]?.name) contractorName = data[0].name
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(145deg, #050E1F 0%, #0a1628 60%, #0f1d35 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: '0 80px',
        }}
      >
        <div style={{ position: 'absolute', top: -120, right: -80, width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />

        {/* SnagIT wordmark top-left */}
        <div style={{ position: 'absolute', top: 48, left: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'white', borderRadius: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <svg width="36" height="36" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="7" fill="#1A56DB"/>
              <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
              <circle cx="16" cy="16" r="2.5" fill="white"/>
              <line x1="16" y1="4"  x2="16" y2="9"  stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="4"  y1="16" x2="9"  y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>
            <span style={{ color: 'white' }}>Snag</span>
            <span style={{ color: '#22C55E' }}>IT</span>
          </div>
        </div>

        {/* Label */}
        <div style={{ display: 'flex', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 99, padding: '8px 20px' }}>
            <div style={{ width: 8, height: 8, borderRadius: 99, background: '#A5B4FC' }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: '#C4B5FD', letterSpacing: '0.5px' }}>Your assigned snags</span>
          </div>
        </div>

        {/* Contractor name */}
        <div style={{ display: 'flex', fontSize: contractorName.length > 30 ? 60 : 76, fontWeight: 800, color: 'white', letterSpacing: '-2px', lineHeight: 1.1, textAlign: 'center', maxWidth: 900 }}>
          {contractorName}
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 44, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '8px 20px' }}>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>snagitapp.co.za</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
