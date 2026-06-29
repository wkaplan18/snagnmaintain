'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, CheckCircle, Loader2, Pencil, RotateCcw, X } from 'lucide-react'
import { compressImage } from '@/lib/compressImage'

const MARKUP_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#22c55e', '#ffffff']

function PhotoMarkupEditor({ photoUrl, onDone, onCancel }: {
  photoUrl: string
  onDone: (file: File) => void
  onCancel: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [color, setColor] = useState('#ef4444')
  const [paths, setPaths] = useState<Array<{ color: string; pts: { x: number; y: number }[] }>>([])
  const drawing = useRef(false)
  const currentPts = useRef<{ x: number; y: number }[]>([])

  const redraw = useCallback((extraPts?: { x: number; y: number }[]) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const all = extraPts ? [...paths, { color, pts: extraPts }] : paths
    for (const path of all) {
      if (path.pts.length < 2) continue
      ctx.beginPath()
      ctx.strokeStyle = path.color
      ctx.lineWidth = Math.max(3, canvas.width / 120)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(path.pts[0].x, path.pts[0].y)
      for (let i = 1; i < path.pts.length; i++) ctx.lineTo(path.pts[i].x, path.pts[i].y)
      ctx.stroke()
    }
  }, [paths, color])

  function initCanvas(img: HTMLImageElement) {
    const canvas = canvasRef.current!
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    imgRef.current = img
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
  }

  function getXY(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const src = 'touches' in e ? e.touches[0] : e
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy }
  }

  function onStart(e: React.TouchEvent | React.MouseEvent) { e.preventDefault(); drawing.current = true; currentPts.current = [getXY(e)] }
  function onMove(e: React.TouchEvent | React.MouseEvent) { e.preventDefault(); if (!drawing.current) return; currentPts.current = [...currentPts.current, getXY(e)]; redraw(currentPts.current) }
  function onEnd(e: React.TouchEvent | React.MouseEvent) { e.preventDefault(); if (!drawing.current || currentPts.current.length < 2) { drawing.current = false; return }; const pts = [...currentPts.current]; currentPts.current = []; drawing.current = false; setPaths(p => [...p, { color, pts }]) }

  useEffect(() => { redraw() }, [redraw])

  function handleDone() {
    const canvas = canvasRef.current
    if (!canvas) { onCancel(); return }
    const timeout = setTimeout(() => onCancel(), 6000)
    canvas.toBlob(blob => { clearTimeout(timeout); if (!blob) { onCancel(); return }; onDone(new File([blob], 'marked-up.jpg', { type: 'image/jpeg' })) }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <img src={photoUrl} className="hidden" alt="" onLoad={e => initCanvas(e.currentTarget)} />
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="max-h-full max-w-full touch-none" style={{ cursor: 'crosshair' }}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} />
      </div>
      <div className="bg-black/90" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-center gap-4 px-4 pt-3 pb-2">
          {MARKUP_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className="h-9 w-9 flex-shrink-0 rounded-full border-[3px] transition-transform active:scale-90"
              style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <button onClick={() => setPaths(p => p.slice(0, -1))} disabled={paths.length === 0} className="flex items-center gap-1.5 text-sm text-white disabled:opacity-40">
            <RotateCcw className="h-4 w-4" /> Undo
          </button>
          <button onClick={handleDone} className="rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black active:scale-95 transition-transform">Done</button>
          <button onClick={onCancel} className="text-sm text-slate-400">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function ReportClient({
  projectId,
  projectName,
  unitLabel,
}: {
  projectId: string
  projectName: string
  unitLabel: string
}) {
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showMarkup, setShowMarkup] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [unitName, setUnitName] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [reporterPhone, setReporterPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [snagNumber, setSnagNumber] = useState<number | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setPhoto(compressed)
    setPhotoUrl(URL.createObjectURL(compressed))
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('project_id', projectId)
      fd.append('title', title.trim())
      fd.append('unit_name', unitName.trim() || 'General')
      if (description.trim()) fd.append('description', description.trim())
      if (reporterName.trim()) fd.append('reporter_name', reporterName.trim())
      if (reporterPhone.trim()) fd.append('reporter_phone', reporterPhone.trim())
      if (photo) fd.append('photo', photo)

      const res = await fetch('/api/report', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')
      setSnagNumber(json.snag_number)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (snagNumber !== null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A56DB]">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Report submitted</h1>
        <p className="mt-2 text-slate-500">
          Your issue has been logged as <span className="font-semibold text-slate-700">#{snagNumber}</span>. The management team will follow up.
        </p>
        <p className="mt-6 text-sm font-medium text-slate-400">{projectName}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 pb-4 pt-6">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A56DB]">
            <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4">
              <circle cx="16" cy="16" r="8.5" stroke="white" strokeWidth="2" opacity="0.9"/>
              <circle cx="16" cy="16" r="2.5" fill="white"/>
              <line x1="16" y1="4" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="4" y1="16" x2="9" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-[#1A56DB]">Snag<span style={{ color: '#22C55E' }}>IT</span></span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Log an issue</h1>
        <p className="text-sm text-slate-500">{projectName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-4 pb-10 pt-5">
        {/* Photo */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Photo <span className="font-normal text-slate-400">(optional but helpful)</span>
          </label>
          {showMarkup && photoUrl && (
            <PhotoMarkupEditor
              photoUrl={photoUrl}
              onDone={file => { setPhoto(file); setPhotoUrl(URL.createObjectURL(file)); setShowMarkup(false) }}
              onCancel={() => setShowMarkup(false)}
            />
          )}
          {photoUrl ? (
            <div className="relative">
              <img src={photoUrl} alt="Issue" className="h-52 w-full rounded-2xl object-cover" />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoUrl(null) }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowMarkup(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#1A56DB] underline underline-offset-2"
              >
                <Pencil className="h-3.5 w-3.5" /> Mark up photo
              </button>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <label className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 cursor-pointer transition-colors hover:border-[#1A56DB]/40 hover:bg-blue-50/30">
                <Camera className="h-8 w-8" />
                <span className="text-sm font-medium">Take a photo</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              </label>
              <label className="flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
                Choose from Library
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            What is the issue? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Leaking tap in bathroom"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            More details <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Any extra information that might help…"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
          />
        </div>

        {/* Unit */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 capitalize">
            Your {unitLabel}
          </label>
          <input
            type="text"
            value={unitName}
            onChange={e => setUnitName(e.target.value)}
            placeholder={unitLabel === 'unit or area' ? 'e.g. Unit 4A, Pool, Parking B2' : 'e.g. Apt 4B, Unit 12'}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
          />
        </div>

        {/* Reporter info */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your details (optional)</p>
          <input
            type="text"
            value={reporterName}
            onChange={e => setReporterName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
          />
          <input
            type="tel"
            value={reporterPhone}
            onChange={e => setReporterPhone(e.target.value)}
            placeholder="Phone / WhatsApp number"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
          />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1A56DB] py-4 text-base font-semibold text-white transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit report'}
        </button>

        <p className="text-center text-xs text-slate-400">
          Powered by SnagIT · Your information is kept private
        </p>
      </form>
    </div>
  )
}
