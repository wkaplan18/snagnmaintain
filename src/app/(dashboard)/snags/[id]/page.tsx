import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import SnagDetailClient from './SnagDetailClient'
import { DASHBOARD_TERMS } from '@/types'
import type { OrgType } from '@/types'

export default async function SnagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: orgMember }, { data: snag }, { data: contractors }] = await Promise.all([
    supabase.from('org_members').select('organizations(org_type)').eq('user_id', user.id).limit(1).maybeSingle(),
    supabase.from('snags').select(`
      *,
      attachments(*),
      contractor:contractors(id, name, company, whatsapp, trade, access_token),
      room:rooms(id, name),
      unit:units(id, name),
      project:projects(id, name)
    `).eq('id', id).maybeSingle(),
    supabase.from('contractors').select('*').eq('is_active', true).order('name'),
  ])

  if (!snag) notFound()

  const raw = orgMember?.organizations
  const org = Array.isArray(raw) ? raw[0] : raw as { org_type?: string } | null | undefined
  const terms = DASHBOARD_TERMS[(org?.org_type ?? 'builder') as OrgType]

  // Supabase types FK joins as arrays — flatten each to a single object
  const one = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null)

  const flat = {
    ...snag,
    contractor: one(snag.contractor),
    room: one(snag.room),
    unit: one(snag.unit),
    project: one(snag.project),
  }

  return <SnagDetailClient snag={flat} contractors={contractors ?? []} terms={terms} />
}
