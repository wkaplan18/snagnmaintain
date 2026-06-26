import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import ContractorPortal from './ContractorPortal'

export const dynamic = 'force-dynamic'

export default async function ContractorPage({ params }: { params: Promise<{ token: string }> }) {
  // Belt-and-suspenders: opt every fetch in this render out of the Data Cache.
  // force-dynamic alone doesn't always prevent Supabase fetches from being
  // served stale when there's no auth cookie to vary on.
  noStore()

  const { token } = await params
  const supabase = createAdminClient()

  // Find contractor by token (service role bypasses RLS)
  const { data: contractor, error } = await supabase
    .from('contractors')
    .select('id, name, company, trade, org_id')
    .eq('access_token', token)
    .eq('is_active', true)
    .gt('token_expires_at', new Date().toISOString())
    .single()

  if (error || !contractor) notFound()

  // Get assigned snags
  const { data: snags } = await supabase
    .from('snags')
    .select(`
      id, snag_number, title, description, status, due_date, created_at,
      attachments(id, public_url, is_resolution),
      unit:units(name),
      room:rooms(name),
      project:projects(name, address, city)
    `)
    .eq('assigned_to', contractor.id)
    .order('created_at', { ascending: false })

  // Supabase types FK joins as arrays — flatten each to a single object
  const one = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null)
  const flatSnags = (snags ?? []).map((s) => ({
    ...s,
    unit: one(s.unit),
    room: one(s.room),
    project: one(s.project),
  }))

  return (
    <ContractorPortal
      contractor={contractor}
      snags={flatSnags}
      token={token}
    />
  )
}
