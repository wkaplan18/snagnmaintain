import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, client_name, client_whatsapp } = await req.json()
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  // RLS ensures user can only read/write projects in their org
  const { data: project } = await supabase
    .from('projects')
    .select('id, share_token')
    .eq('id', project_id)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const token = project.share_token ?? randomUUID()

  const { error } = await supabase
    .from('projects')
    .update({
      client_name: client_name?.trim() || null,
      client_whatsapp: client_whatsapp?.trim() || null,
      share_token: token,
    })
    .eq('id', project_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ share_token: token })
}
