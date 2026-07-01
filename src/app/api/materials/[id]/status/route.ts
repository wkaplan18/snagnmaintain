import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllUserOrgs, getActiveOrgId } from '@/lib/activeOrg'
import type { MaterialRequestStatus } from '@/types'

const VALID_TRANSITIONS: Record<string, MaterialRequestStatus> = {
  pending: 'ordered',
  ordered: 'fulfilled',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status, status_note } = await req.json()
  const validStatuses: MaterialRequestStatus[] = ['ordered', 'fulfilled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const allOrgs = await getAllUserOrgs(user.id)
  const orgId = await getActiveOrgId(user.id, allOrgs)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // Verify the request belongs to this org and the transition is valid
  const { data: existing } = await supabase
    .from('material_requests')
    .select('id, status')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (VALID_TRANSITIONS[existing.status] !== status) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 422 })
  }

  const now = new Date().toISOString()
  const update = {
    status,
    status_note: status_note ?? null,
    ...(status === 'ordered'    ? { ordered_at: now }    : {}),
    ...(status === 'fulfilled'  ? { fulfilled_at: now }  : {}),
  }

  const { data, error } = await supabase
    .from('material_requests')
    .update(update)
    .eq('id', id)
    .eq('org_id', orgId)
    .select('id, status, status_note, ordered_at, fulfilled_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
  }

  return NextResponse.json(data)
}
