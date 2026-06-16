'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, ChevronRight, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compressImage'
import type { Contractor, DashboardTerms, Room } from '@/types'

type Step = 'photo' | 'details' | 'room' | 'assign' | 'whatsapp'

interface Props {
  projectId: string
  unitId: string
  orgId: string
  terms: DashboardTerms
  initialRooms: Room[]
  initialContractors: Contractor[]
}

function formatWhatsApp(raw: string): string {
  const num = raw.replace(/[\s\-().]/g, '')
  if (num.startsWith('0027')) return '+27' + num.slice(4)
  if (num.startsWith('00')) return '+' + num.slice(2)
  if (num.startsWith('0')) return '+27' + num.slice(1)
  if (/^\d/.test(num) && !num.startsWith('+')) return '+' + num
  return num
}

const WA_ICON = (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export default function AddJobClient({ projectId, unitId, orgId, terms, initialRooms, initialContractors }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('photo')
  const [savedSnagId, setSavedSnagId] = useState<string | null>(null)

  // Data collected across steps
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [roomId, setRoomId] = useState('')

  // Rooms
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [addingRoom, setAddingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [roomBusy, setRoomBusy] = useState(false)

  // Contractors
  const [contractors, setContractors] = useState<Contractor[]>(initialContractors)
  const [addingContractor, setAddingContractor] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTrade, setNewTrade] = useState('')
  const [newWhatsApp, setNewWhatsApp] = useState('')
  const [newIsInternal, setNewIsInternal] = useState(false)
  const [contractorBusy, setContractorBusy] = useState(false)

  const [saving, setSaving] = useState(false)
  const [waUrl, setWaUrl] = useState<string | null>(null)
  const [waName, setWaName] = useState<string | null>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setPhoto(compressed)
    setPhotoUrl(URL.createObjectURL(compressed))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function addRoom() {
    if (!newRoomName.trim()) return
    setRoomBusy(true)
    const { data, error } = await supabase
      .from('rooms')
      .insert({ unit_id: unitId, name: newRoomName.trim(), room_order: rooms.length })
      .select('*')
      .single()
    if (!error && data) {
      setRooms(r => [...r, data])
      setRoomId(data.id)
      setNewRoomName('')
      setAddingRoom(false)
    } else {
      alert(error?.message ?? 'Could not add room')
    }
    setRoomBusy(false)
  }

  async function saveJob() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/snags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          unit_id: unitId,
          room_id: roomId || null,
          title,
          description,
          category: 'other',
          priority: 'medium',
          assigned_to: null,
          due_date: null,
          ai_suggested: false,
          ai_confidence: null,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const snag = await res.json()

      if (photo && snag.id) {
        const fd = new FormData()
        fd.append('file', photo)
        fd.append('snagId', snag.id)
        await fetch('/api/uploads/snag-photo', { method: 'POST', body: fd })
      }

      setSavedSnagId(snag.id)
      setStep('assign')
    } catch {
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function assignContractor(contractor: Contractor) {
    if (!savedSnagId) return
    setContractorBusy(true)
    await supabase
      .from('snags')
      .update({ assigned_to: contractor.id, status: 'assigned', assigned_at: new Date().toISOString() })
      .eq('id', savedSnagId)

    if (contractor.whatsapp) {
      const digits = contractor.whatsapp.replace(/\D/g, '')
      const e164 = digits.startsWith('0') ? '27' + digits.slice(1) : digits
      const msg = `Hi ${contractor.name}, you've been assigned a new ${terms.issue.toLowerCase()}: "${title}". View and update it here:\n${window.location.origin}/c/${contractor.access_token}`
      setWaUrl(`https://wa.me/${e164}?text=${encodeURIComponent(msg)}`)
      setWaName(contractor.name)
      setStep('whatsapp')
    } else {
      router.push('/snags')
      router.refresh()
    }
    setContractorBusy(false)
  }

  async function addAndAssignContractor() {
    if (!newName.trim()) return
    setContractorBusy(true)
    const { data, error } = await supabase
      .from('contractors')
      .insert({
        org_id: orgId,
        name: newName.trim(),
        trade: newTrade.trim() || null,
        whatsapp: newWhatsApp.trim() || null,
        is_internal: newIsInternal,
      })
      .select('*')
      .single()
    if (!error && data) {
      setContractors(c => [...c, data])
      await assignContractor(data)
    } else {
      alert(error?.message ?? 'Could not add')
      setContractorBusy(false)
    }
  }

  // ─── STEP: Photo ─────────────────────────────────────────────────────────────
  if (step === 'photo') {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="border-b border-slate-200 px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={() => router.push('/snags')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs text-slate-400">Step 1 of 3</p>
              <h1 className="text-base font-bold text-slate-900">Add a photo</h1>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 gap-6">
          {photoUrl ? (
            <div className="w-full max-w-sm">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl">
                <img src={photoUrl} alt="Job photo" className="h-full w-full object-cover" />
                <button
                  onClick={() => { setPhoto(null); setPhotoUrl(null) }}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs font-medium text-[#1A56DB] underline underline-offset-2"
              >
                Retake photo
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-52 w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 active:bg-slate-100 transition-colors"
            >
              <Camera className="h-14 w-14" />
              <span className="text-base font-medium">Tap to take a photo</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />

        <div className="px-4 pb-28 pt-4 space-y-2">
          <button
            onClick={() => setStep('details')}
            className="sf-btn-primary flex w-full items-center justify-center gap-2 py-4 text-base"
          >
            Next <ChevronRight className="h-5 w-5" />
          </button>
          {!photoUrl && (
            <button
              onClick={() => setStep('details')}
              className="w-full py-2 text-sm text-slate-400 underline underline-offset-2"
            >
              Skip photo
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── STEP: Details ───────────────────────────────────────────────────────────
  if (step === 'details') {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="border-b border-slate-200 px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={() => setStep('photo')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs text-slate-400">Step 2 of 3</p>
              <h1 className="text-base font-bold text-slate-900">Describe the problem</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pt-6 space-y-5">
          {photoUrl && (
            <div className="h-20 w-20 overflow-hidden rounded-xl border border-slate-100">
              <img src={photoUrl} alt="Job photo" className="h-full w-full object-cover" />
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              What&apos;s the problem? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Leaking tap in bathroom"
              className="sf-input"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Details <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Any extra details…"
              rows={4}
              className="sf-input resize-none"
            />
          </div>
        </div>

        <div className="px-4 pb-28 pt-4">
          <button
            onClick={() => setStep('room')}
            disabled={!title.trim()}
            className="sf-btn-primary flex w-full items-center justify-center gap-2 py-4 text-base disabled:opacity-40"
          >
            Next <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  // ─── STEP: Room ──────────────────────────────────────────────────────────────
  if (step === 'room') {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="border-b border-slate-200 px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={() => setStep('details')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs text-slate-400">Step 3 of 3</p>
              <h1 className="text-base font-bold text-slate-900">Which room?</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pt-6">
          <div className="flex flex-wrap gap-2">
            {rooms.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoomId(roomId === r.id ? '' : r.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  roomId === r.id
                    ? 'border-[#1A56DB] bg-[#1A56DB] text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {r.name}
              </button>
            ))}
            {!addingRoom && (
              <button
                type="button"
                onClick={() => setAddingRoom(true)}
                className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 hover:border-slate-400 transition-colors"
              >
                + Add room
              </button>
            )}
          </div>

          {addingRoom && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                autoFocus
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRoom()}
                placeholder="e.g. Kitchen"
                className="sf-input flex-1"
              />
              <button onClick={addRoom} disabled={roomBusy} className="sf-btn-primary px-4 py-2 text-sm disabled:opacity-60">Add</button>
              <button onClick={() => setAddingRoom(false)} className="sf-btn-secondary px-3 py-2 text-sm">✕</button>
            </div>
          )}

          {rooms.length === 0 && !addingRoom && (
            <p className="mt-4 text-sm text-slate-400">No rooms yet — add one above, or skip to save.</p>
          )}
        </div>

        <div className="px-4 pb-28 pt-4 space-y-2">
          <button
            onClick={saveJob}
            disabled={saving}
            className="sf-btn-primary w-full py-4 text-base disabled:opacity-50"
          >
            {saving
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</>
              : `Save ${terms.issue}`}
          </button>
          {!roomId && (
            <p className="text-center text-xs text-slate-400">Room is optional — you can skip it</p>
          )}
        </div>
      </div>
    )
  }

  // ─── STEP: Assign ────────────────────────────────────────────────────────────
  if (step === 'assign') {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="border-b border-slate-200 px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-green-600">{terms.issue} saved!</p>
              <h1 className="text-base font-bold text-slate-900">Who should fix this?</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contractors.length > 0 && !addingContractor && (
            <div className="divide-y divide-slate-100">
              {contractors.map(c => (
                <button
                  key={c.id}
                  onClick={() => assignContractor(c)}
                  disabled={contractorBusy}
                  className="flex w-full items-center gap-3 px-4 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left disabled:opacity-60"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#1A56DB]/10 text-sm font-bold text-[#1A56DB]">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                    {c.trade && <p className="text-xs text-slate-500">{c.trade}</p>}
                    {c.whatsapp
                      ? <p className="text-xs text-green-600">WhatsApp: {c.whatsapp}</p>
                      : <p className="text-xs text-slate-400">No WhatsApp number</p>
                    }
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
                </button>
              ))}
              <button
                onClick={() => setAddingContractor(true)}
                className="flex w-full items-center gap-3 px-4 py-4 text-[#1A56DB] hover:bg-[#EEF4FF] transition-colors"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-[#1A56DB]/30 text-2xl font-light">
                  +
                </div>
                <span className="text-sm font-medium">Add new {terms.contractor.toLowerCase()}</span>
              </button>
            </div>
          )}

          {contractors.length === 0 && !addingContractor && (
            <div className="flex flex-col items-center px-6 pt-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF4FF] text-3xl">👷</div>
              <p className="text-base font-semibold text-slate-900">No {terms.contractor.toLowerCase()}s yet</p>
              <p className="mt-1 text-sm text-slate-500 max-w-xs">
                Add a {terms.contractor.toLowerCase()} to send them this {terms.issue.toLowerCase()} via WhatsApp.
              </p>
              <button
                onClick={() => setAddingContractor(true)}
                className="mt-6 sf-btn-primary px-6 py-3"
              >
                + Add {terms.contractor.toLowerCase()}
              </button>
            </div>
          )}

          {addingContractor && (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">New {terms.contractor.toLowerCase()}</p>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setNewIsInternal(false)}
                  className={`flex-1 py-2.5 transition-colors ${!newIsInternal ? 'bg-[#1A56DB] text-white' : 'text-slate-500'}`}
                >
                  {terms.externalLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setNewIsInternal(true)}
                  className={`flex-1 py-2.5 transition-colors ${newIsInternal ? 'bg-[#1A56DB] text-white' : 'text-slate-500'}`}
                >
                  {terms.internalLabel}
                </button>
              </div>
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Name *"
                className="sf-input"
              />
              <input
                type="text"
                value={newTrade}
                onChange={e => setNewTrade(e.target.value)}
                placeholder={terms.contractorTrade}
                className="sf-input"
              />
              <input
                type="tel"
                value={newWhatsApp}
                onChange={e => setNewWhatsApp(e.target.value)}
                onBlur={e => { if (e.target.value.trim()) setNewWhatsApp(formatWhatsApp(e.target.value.trim())) }}
                placeholder="WhatsApp number"
                className="sf-input"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={addAndAssignContractor}
                  disabled={contractorBusy || !newName.trim()}
                  className="sf-btn-primary flex-1 py-3 text-sm disabled:opacity-60"
                >
                  {contractorBusy
                    ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    : 'Add & assign'}
                </button>
                <button
                  onClick={() => setAddingContractor(false)}
                  className="sf-btn-secondary px-4 py-3 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-4 pb-28 pt-3">
          <button
            onClick={() => router.push('/snags')}
            className="w-full py-2 text-sm text-slate-400 underline underline-offset-2"
          >
            Skip — assign later
          </button>
        </div>
      </div>
    )
  }

  // ─── STEP: WhatsApp ──────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-8 text-center bg-white">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">Ready to send!</p>
        <p className="mt-2 text-sm text-slate-500 max-w-xs">
          Send {waName} the link — they can view the job and mark it as done from their phone.
        </p>
      </div>
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener"
          onClick={() => router.push('/snags')}
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-4 text-base font-bold text-white hover:bg-[#1EBE5B] active:scale-[0.98] transition-[transform,opacity]"
        >
          {WA_ICON}
          Send to {waName} via WhatsApp
        </a>
      )}
      <button
        onClick={() => router.push('/snags')}
        className="text-sm text-slate-400 underline underline-offset-2"
      >
        Done
      </button>
    </div>
  )
}
