import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { DASHBOARD_TERMS } from '@/types'
import type { OrgType } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's org
  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(id, name, logo_url, plan, org_type)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!orgMember) redirect('/onboarding')

  const orgId = orgMember.org_id

  // Run all remaining queries in parallel — no dependencies between them
  const [
    { data: projectStats },
    { count: needsReview },
    { data: projects },
  ] = await Promise.all([
    supabase.from('snag_stats_by_project').select('*'),
    supabase
      .from('snags')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'fixed'),
    supabase
      .from('projects')
      .select('id, name, status, image_url, city')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false }),
  ])

  const org = Array.isArray(orgMember.organizations)
    ? orgMember.organizations[0]
    : orgMember.organizations as { name?: string; org_type?: string } | null
  const orgType = (org?.org_type ?? 'builder') as OrgType
  const terms = DASHBOARD_TERMS[orgType]

  return (
    <DashboardClient
      orgName={org?.name ?? 'My Organisation'}
      terms={terms}
      projects={projects ?? []}
      projectStats={projectStats ?? []}
      needsReview={needsReview ?? 0}
    />
  )
}
