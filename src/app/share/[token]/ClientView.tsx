'use client'

import { useState } from 'react'
import { CheckCircle, Clock, X, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Client-facing status labels ─────────────────────────────────────────────
// Intentionally simplified — clients don't need to see internal workflow steps
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

// ─── Snag card (read-only) ────────────────────────────────────────────────────
function SnagCard({ snag, onViewPhoto }: { snag: ClientSnag; onViewPhoto: (url: string) => void }) {
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
}

export default function ClientView({ project, units, stats }: Props) {
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)
  const completionPct = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

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
                          <SnagCard key={snag.id} snag={snag} onViewPhoto={setViewingPhoto} />
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
