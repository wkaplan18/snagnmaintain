import { createClient } from '@/lib/supabase/server'
import { getAllUserOrgs, getActiveOrgId } from '@/lib/activeOrg'
import { redirect } from 'next/navigation'
import NewMaterialClient from './NewMaterialClient'
import type { OrgType } from '@/types'

export default async function NewMaterialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const allOrgs = await getAllUserOrgs(user.id)
  const orgId = await getActiveOrgId(user.id, allOrgs)
  if (!orgId) redirect('/onboarding')

  const activeOrg = allOrgs.find(o => o.org_id === orgId)
  const orgType = (activeOrg?.org?.org_type ?? 'builder') as OrgType
  if (orgType !== 'builder') redirect('/dashboard')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('org_id', orgId)
    .order('name')

  if (!projects || projects.length === 0) redirect('/projects/new')

  return <NewMaterialClient projects={projects} />
}
