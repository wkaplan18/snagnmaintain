import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContractorsClient from './ContractorsClient'
import { DASHBOARD_TERMS } from '@/types'
import type { OrgType } from '@/types'

const UNATTENDED_STATUSES = ['open', 'assigned', 'rejected']

export default async function ContractorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id, organizations(org_type)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!orgMember) redirect('/onboarding')

  const orgId = orgMember.org_id

  const [{ data: contractors }, { data: projects }] = await Promise.all([
    supabase.from('contractors').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('projects').select('id').eq('org_id', orgId),
  ])

  const projectIds = (projects ?? []).map(p => p.id)

  const openCountByContractor: Record<string, number> = {}
  if (projectIds.length > 0) {
    const { data: snagRows } = await supabase
      .from('snags')
      .select('assigned_to')
      .in('project_id', projectIds)
      .in('status', UNATTENDED_STATUSES)
      .not('assigned_to', 'is', null)

    for (const s of snagRows ?? []) {
      if (s.assigned_to) {
        openCountByContractor[s.assigned_to] = (openCountByContractor[s.assigned_to] ?? 0) + 1
      }
    }
  }

  const org = Array.isArray(orgMember.organizations) ? orgMember.organizations[0] : orgMember.organizations as { org_type?: string } | null
  const orgType = (org?.org_type ?? 'builder') as OrgType
  const terms = DASHBOARD_TERMS[orgType]

  return <ContractorsClient orgId={orgId} contractors={contractors ?? []} terms={terms} openCountByContractor={openCountByContractor} />
}
