'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, ChevronDown, ChevronUp, Clock, Loader2, MessageCircle, X } from 'lucide-react'

// ─── Client-facing status labels ─────────────────────────────────────────────
function clientStatus(status: string): { label: string; color: string; bg: string } {
  if (['approved', 'closed'].includes(status))
    return { label: 'Resolved',     color: 'text-green-700',  bg: 'bg-green-50 border-green-200' }
  if (status === 'fixed')
    return { label: 'Under Review', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' }
  return   { label: 'In Progress',  color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Attachment { id: string; public_url: string; is_resolution: boolean }
interface ClientSnag {
  id: string
  snag_number: number
  title: string
  description: string | null
  status: string
  category: string
  attachments: Attachment[]
}
interface RoomGroup  { name: string; snags: ClientSnag[] }
interface UnitGroup  { id: string; name: string; rooms: RoomGroup[] }
interface ProjectInfo {
  name: string
  address: string | null
  city: string | null
  province: string | null
}
interface Question {
  id: string
  snag_id: string
  body: string
  created_at: string
  reply_body: string | null
  replied_at: string | null
}

// ─── Photo lightbox ───────────────────────────────────────────────────────────
function PhotoViewer({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm border border-white/20 hover:bg-white/25 active:scale-95 transition-[transform,background-color]"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={url}
        alt=""
        onClick={e => e.stopPropagation()}
        className="rounded-xl object-contain"
        style={{ maxHeight: '88vh', maxWidth: '95vw' }}
      />
    </div>
  )
}

// ─── Inline question thread ───────────────────────────────────────────────────
function QuestionThread({
  snagId,
  token,
  questions,
  onQuestionAdded,
}: {
  snagId: string
  token: string
  questions: Question[]
  onQuestionAdded: (q: Question) => void
}) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const myQuestions = questions.filter(q => q.snag_id === snagId)

  async function submit() {
    if (!body.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/share/${token}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snag_id: snagId, body: body.trim() }),
      })
      if (res.ok) {
        const q: Question = await res.json()
        onQuestionAdded(q)
        setBody('')
        setSent(true)
        setOpen(false)
        setTimeout(() => setSent(false), 4000)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {/* Existing questions */}
      {myQuestions.length > 0 && (
        <div className="mb-3 space-y-2">
          {myQuestions.map(q => (
            <div key={q.id} className="space-y-1.5">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <MessageCircle className="h-3 w-3 text-slate-500" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{q.body}</p>
              </div>
              {q.reply_body && (
                <div className="ml-7 rounded-xl bg-[#EEF4FF] border border-[#C7D9F8] px-3 py-2">
                  <p className="text-[11px] font-semibold text-[#1A56DB] mb-0.5">Reply</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{q.reply_body}</p>
                </div>
              )}
              {!q.reply_body && (
                <p className="ml-7 text-[11px] text-slate-400">Awaiting reply…</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sent confirmation */}
      {sent && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Question sent — we'll be in touch.</p>
        </div>
      )}

      {/* Ask button / form */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-[#1A56DB] transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Ask a question about this item
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type your question…"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#1A56DB] focus:bg-white resize-none transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={sending || !body.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.97] transition-[transform,opacity]"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Send
            </button>
            <button
              onClick={() => { setOpen(false); setBody('') }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Snag card (read-only + questions) ───────────────────────────────────────
function SnagCard({
  snag,
  token,
  questions,
  onQuestionAdded,
  onViewPhoto,
}: {
  snag: ClientSnag
  token: string
  questions: Question[]
  onQuestionAdded: (q: Question) => void
  onViewPhoto: (url: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const s = clientStatus(snag.status)
  const photo = snag.attachments.find(a => !a.is_resolution)
  const isResolved = ['approved', 'closed'].includes(snag.status)

  return (
    <div className="sf-card overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${isResolved ? 'bg-green-500' : 'bg-[#1A56DB]'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">#{snag.snag_number} {snag.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{snag.category.replace(/_/g, ' ')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.color}`}>
            {s.label}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 space-y-3 pt-3">
          {photo && (
            <button
              onClick={() => onViewPhoto(photo.public_url)}
              className="block h-44 w-full overflow-hidden rounded-xl active:scale-[0.98] transition-transform"
            >
              <img src={photo.public_url} alt="" className="h-full w-full object-cover" />
            </button>
          )}
          {snag.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{snag.description}</p>
          )}
          {isResolved && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-700">This item has been resolved</p>
            </div>
          )}
          {snag.status === 'fixed' && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
              <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-700">Fix submitted — under review</p>
            </div>
          )}
          <QuestionThread
            snagId={snag.id}
            token={token}
            questions={questions}
            onQuestionAdded={onQuestionAdded}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  project: ProjectInfo
  units: UnitGroup[]
  stats: { total: number; resolved: number; inProgress: number }
  token: string
}

export default function ClientView({ project, units, stats, token }: Props) {
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const completionPct = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

  useEffect(() => {
    fetch(`/api/share/${token}/questions`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Question[]) => setQuestions(data))
      .catch(() => {})
  }, [token])

  function handleQuestionAdded(q: Question) {
    setQuestions(prev => [...prev, q])
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {viewingPhoto && <PhotoViewer url={viewingPhoto} onClose={() => setViewingPhoto(null)} />}

      {/* Header */}
      <div className="bg-[#1A56DB] px-4 pt-safe pb-5">
        <div className="mx-auto max-w-lg pt-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <svg width="22" height="22" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="7" fill="white" fillOpacity="0.25"/>
                <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
                <circle cx="16" cy="16" r="2.5" fill="white"/>
                <line x1="16" y1="4" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4" y1="16" x2="9" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-xl font-extrabold leading-none tracking-tight text-white">
                Snag<span style={{ color: '#22C55E' }}>IT</span>
              </p>
              <p className="text-[10px] text-blue-200 font-medium tracking-wide mt-0.5">Client progress view</p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-white">{project.name}</h1>
          {(project.address || project.city) && (
            <p className="text-blue-200 text-sm mt-0.5">
              {[project.address, project.city, project.province].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Progress */}
          <div className="mt-4 rounded-2xl bg-white/15 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white">Overall progress</p>
              <p className="text-lg font-bold text-white">{completionPct}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-green-400 transition-[width] duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-white">{stats.total}</p>
                <p className="text-[11px] text-blue-200">Total items</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stats.inProgress}</p>
                <p className="text-[11px] text-blue-200">In progress</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stats.resolved}</p>
                <p className="text-[11px] text-blue-200">Resolved</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snag list */}
      <div className="mx-auto max-w-lg px-4 pt-5">
        {units.length === 0 ? (
          <div className="sf-card flex flex-col items-center p-10 text-center">
            <CheckCircle className="h-10 w-10 text-green-400 mb-3" />
            <p className="text-sm font-medium text-slate-900">No items logged yet</p>
            <p className="mt-1 text-sm text-slate-500">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {units.map(unit => (
              <div key={unit.id}>
                <p className="mb-3 text-base font-bold text-slate-900">{unit.name}</p>
                <div className="space-y-4">
                  {unit.rooms.map(room => (
                    <div key={room.name}>
                      {room.name !== unit.name && (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{room.name}</p>
                      )}
                      <div className="space-y-2">
                        {room.snags.map(snag => (
                          <SnagCard
                            key={snag.id}
                            snag={snag}
                            token={token}
                            questions={questions}
                            onQuestionAdded={handleQuestionAdded}
                            onViewPhoto={setViewingPhoto}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          Powered by SnagIT · snagitapp.co.za
        </p>
      </div>
    </div>
  )
}
