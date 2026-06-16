import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProjectClient from './ProjectClient'
import { DASHBOARD_TERMS } from '@/types'
import type { Room, OrgType } from '@/types'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: orgMember }, { data: project }, { data: units }, { data: contractors }] = await Promise.all([
    supabase.from('org_members').select('org_id, organizations(org_type)').eq('user_id', user.id).limit(1).maybeSingle(),
    supabase.from('projects').select('id, org_id, name, address, city, province, status, description').eq('id', id).maybeSingle(),
    supabase.from('units').select('id, name, unit_type, floor_number, rooms(id, unit_id, name, room_order, created_at)').eq('project_id', id).order('created_at', { ascending: true }),
    supabase.from('contractors').select('*').eq('is_active', true).order('name'),
  ])

  if (!project) notFound()

  const raw = orgMember?.organizations
  const org = Array.isArray(raw) ? raw[0] : raw as { org_type?: string } | null | undefined
  const terms = DASHBOARD_TERMS[(org?.org_type ?? 'builder') as OrgType]

  const flatUnits = (units ?? []).map(u => ({
    id: u.id,
    name: u.name,
    unit_type: u.unit_type,
    floor_number: u.floor_number,
    rooms: ((u.rooms ?? []) as Room[]).sort((a, b) => a.room_order - b.room_order),
  }))

  return <ProjectClient project={project} units={flatUnits} contractors={contractors ?? []} terms={terms} />
}
