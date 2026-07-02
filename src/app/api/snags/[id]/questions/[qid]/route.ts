import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: snagId, qid } = await params
  const { reply_body } = await req.json()

  if (!reply_body?.trim()) {
    return NextResponse.json({ error: 'reply_body is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the question belongs to a snag the user's org owns
  const { data: question } = await admin
    .from('snag_questions')
    .select('id, snag_id, project_id')
    .eq('id', qid)
    .eq('snag_id', snagId)
    .maybeSingle()

  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  const { data, error } = await admin
    .from('snag_questions')
    .update({ reply_body: reply_body.trim(), replied_at: new Date().toISOString() })
    .eq('id', qid)
    .select('id, snag_id, body, created_at, reply_body, replied_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: snagId, qid } = await params
  const admin = createAdminClient()

  const { error } = await admin
    .from('snag_questions')
    .delete()
    .eq('id', qid)
    .eq('snag_id', snagId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
