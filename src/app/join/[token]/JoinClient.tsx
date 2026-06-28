'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  token: string
  orgName: string
  inviteEmail: string
}

export default function JoinClient({ token, orgName, inviteEmail }: Props) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleAccept() {
    setLoading(true)
    setError('')
    const redirectTo = `${window.location.origin}/auth/callback?next=/join/${token}`
    const { error } = await supabase.auth.signInWithOtp({
      email: inviteEmail,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sf-base px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A56DB]">
            <svg viewBox="0 0 32 32" fill="none" className="h-9 w-9">
              <circle cx="16" cy="16" r="8.5" stroke="white" strokeWidth="2" opacity="0.9"/>
              <circle cx="16" cy="16" r="2.5" fill="white"/>
              <line x1="16" y1="4" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="4" y1="16" x2="9" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Snag<span style={{ color: '#22C55E' }}>IT</span>
          </p>
        </div>

        <div className="sf-card p-6 text-center">
          {!sent ? (
            <>
              <h1 className="text-xl font-bold text-slate-900">You've been invited</h1>
              <p className="mt-2 text-sm text-slate-500">
                Join <strong className="text-slate-800">{orgName}</strong> on SnagIT
              </p>

              <div className="my-5 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-400">Invite sent to</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">{inviteEmail}</p>
              </div>

              <p className="mb-5 text-xs text-slate-400">
                We'll send a sign-in link to that email. Click it and you'll be added to the team instantly.
              </p>

              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full rounded-xl bg-[#1A56DB] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Sending link…' : 'Accept invitation →'}
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-slate-900">Check your email</h1>
              <p className="mt-2 text-sm text-slate-500">
                We sent a sign-in link to <strong className="text-slate-700">{inviteEmail}</strong>. Click it and you'll join {orgName} automatically.
              </p>
              <p className="mt-4 text-xs text-slate-400">Didn't get it? Check your spam folder.</p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">POPIA compliant · snagitapp.co.za</p>
      </div>
    </div>
  )
}
