import { createClient } from '@/lib/supabase/server'
import { getAllUserOrgs, getActiveOrgId } from '@/lib/activeOrg'
import { redirect } from 'next/navigation'
import MaterialsClient from './MaterialsClient'
import type { OrgType } from '@/types'

export default async function MaterialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const allOrgs = await getAllUserOrgs(user.id)
  const orgId = await getActiveOrgId(user.id, allOrgs)
  if (!orgId) redirect('/onboarding')

  const activeOrg = allOrgs.find(o => o.org_id === orgId)
  const orgType = (activeOrg?.org?.org_type ?? 'builder') as OrgType
  if (orgType !== 'builder') redirect('/dashboard')

  const { data: requests } = await supabase
    .from('material_requests')
    .select('*, project:projects(id, name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  return <MaterialsClient initialRequests={requests ?? []} />
}
