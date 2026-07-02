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

  const fontSize = contractorName.length > 28 ? 64 : contractorName.length > 18 ? 80 : 96

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A1628',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Bold blue top bar */}
        <div style={{ display: 'flex', width: '100%', height: 8, background: 'linear-gradient(90deg, #1A56DB, #6366F1)' }} />

        {/* Content area */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '52px 72px', justifyContent: 'space-between' }}>

          {/* Top row: SnagIT wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: 'white', borderRadius: 14 }}>
              <svg width="38" height="38" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="7" fill="#1A56DB"/>
                <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
                <circle cx="16" cy="16" r="2.5" fill="white"/>
                <line x1="16" y1="4"  x2="16" y2="9"  stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4"  y1="16" x2="9"  y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>
              <span style={{ color: 'white' }}>Snag</span>
              <span style={{ color: '#22C55E' }}>IT</span>
            </div>
          </div>

          {/* Middle: label + contractor name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1A56DB', borderRadius: 99, padding: '10px 24px' }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: '#22C55E' }} />
                <span style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '0.3px' }}>Your assigned snags</span>
              </div>
            </div>
            <div style={{ display: 'flex', fontSize, fontWeight: 800, color: 'white', letterSpacing: '-2px', lineHeight: 1.05 }}>
              {contractorName}
            </div>
          </div>

          {/* Bottom: domain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 99, background: '#22C55E' }} />
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>snagitapp.co.za</span>
          </div>

        </div>
      </div>
    ),
    { ...size }
  )
}
