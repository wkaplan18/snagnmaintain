'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, Loader2, X } from 'lucide-react'

type Step = 'project' | 'details'

interface Props {
  projects: { id: string; name: string }[]
}

export default function NewMaterialClient({ projects }: Props) {
  const router = useRouter()

  const singleProject = projects.length === 1
  const [step, setStep] = useState<Step>(singleProject ? 'details' : 'project')
  const [projectId, setProjectId] = useState(singleProject ? projects[0].id : '')
  const [item, setItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!item.trim() || !projectId) return
    setSaving(true)
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          item: item.trim(),
          quantity: quantity.trim() || null,
          urgency,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      router.push('/materials')
      router.refresh()
    } catch {
      alert('Could not submit request. Please try again.')
      setSaving(false)
    }
  }

  if (step === 'project') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-white">
        <div className="border-b border-slate-200 px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={() => router.push('/materials')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs text-slate-400">Step 1 of 2</p>
              <h1 className="text-base font-bold text-slate-900">Which project?</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => { setProjectId(p.id); setStep('details') }}
              className="flex w-full items-center gap-3 px-4 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF] text-xl">
                🏗️
              </div>
              <p className="flex-1 text-sm font-semibold text-slate-900">{p.name}</p>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  const selectedProject = projects.find(p => p.id === projectId)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-white">
      <div className="border-b border-slate-200 px-4 pt-safe pb-4">
        <div className="flex items-center gap-3 pt-3">
          <button
            onClick={() => singleProject ? router.push('/materials') : setStep('project')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            {!singleProject && <p className="text-xs text-slate-400">Step 2 of 2</p>}
            <h1 className="text-base font-bold text-slate-900">Request materials</h1>
            {selectedProject && <p className="text-xs text-slate-400">{selectedProject.name}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            What do you need? <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            autoFocus
            value={item}
            onChange={e => setItem(e.target.value)}
            placeholder="e.g. Cement bags, 20mm conduit, Tiles"
            className="sf-input"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Quantity <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="e.g. 10 bags, 3 lengths, 50m²"
            className="sf-input"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Priority</label>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-sm font-medium">
            <button
              type="button"
              onClick={() => setUrgency('normal')}
              className={`flex-1 py-2.5 transition-colors ${urgency === 'normal' ? 'bg-[#1A56DB] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setUrgency('urgent')}
              className={`flex-1 py-2.5 transition-colors ${urgency === 'urgent' ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              🔴 Urgent
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Notes <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any extra details for the office…"
            rows={3}
            className="sf-input resize-none"
          />
        </div>
      </div>

      <div className="px-4 pb-28 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!item.trim() || saving}
          className="sf-btn-primary flex w-full items-center justify-center gap-2 py-4 text-base disabled:opacity-40"
        >
          {saving
            ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
            : 'Send Request to Office'
          }
        </button>
      </div>
    </div>
  )
}
