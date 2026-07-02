import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'noreply@snagitapp.co.za'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://snagitapp.co.za'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: project } = await admin
    .from('projects')
    .select('id')
    .eq('share_token', token)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await admin
    .from('snag_questions')
    .select('id, snag_id, body, created_at, reply_body, replied_at')
    .eq('project_id', project.id)
    .eq('share_token', token)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdminClient()

  const { snag_id, body } = await req.json()

  if (!snag_id || !body?.trim()) {
    return NextResponse.json({ error: 'snag_id and body are required' }, { status: 400 })
  }

  // Verify share token is valid and get org email + project/snag info
  const { data: project } = await admin
    .from('projects')
    .select('id, name, org_id, organizations(email, name)')
    .eq('share_token', token)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify snag belongs to this project
  const { data: snag } = await admin
    .from('snags')
    .select('id, snag_number, title')
    .eq('id', snag_id)
    .eq('project_id', project.id)
    .maybeSingle()

  if (!snag) return NextResponse.json({ error: 'Snag not found' }, { status: 404 })

  const { data: question, error } = await admin
    .from('snag_questions')
    .insert({
      snag_id,
      project_id: project.id,
      share_token: token,
      body: body.trim(),
    })
    .select('id, snag_id, body, created_at, reply_body, replied_at')
    .single()

  if (error || !question) {
    return NextResponse.json({ error: error?.message ?? 'Could not save question' }, { status: 500 })
  }

  // Email notification to org if they have an email set
  const raw = project.organizations
  const org = Array.isArray(raw) ? raw[0] : raw as { email?: string; name?: string } | null

  if (org?.email) {
    const shareUrl = `${BASE_URL}/share/${token}`
    await resend.emails.send({
      from: `SnagIT <${FROM}>`,
      to: org.email,
      subject: `New client question on ${project.name}`,
      text: `A client has asked a question about ${project.name}.\n\nItem: #${snag.snag_number} ${snag.title}\nQuestion: ${body.trim()}\n\nView and reply here:\n${shareUrl}\n\nGo to SnagIT to reply from the snag detail page.`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
        <tr><td style="background:#ffffff;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;border-bottom:1px solid #E2E8F0">
          <p style="margin:0;font-size:20px;font-weight:700;color:#1E293B">New client question</p>
          <p style="margin:6px 0 0;font-size:14px;color:#64748B">${project.name}</p>
        </td></tr>
        <tr><td style="background:#fff;padding:32px;border-radius:0 0 16px 16px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em">Item</p>
          <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:#1E293B">#${snag.snag_number} ${snag.title}</p>
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em">Question</p>
          <div style="background:#F1F5F9;border-radius:10px;padding:16px;margin-bottom:28px">
            <p style="margin:0;font-size:15px;color:#334155;line-height:1.6">${body.trim()}</p>
          </div>
          <p style="margin:0 0 20px;font-size:14px;color:#64748B;line-height:1.6">
            Open the snag in SnagIT to reply. Your reply will appear on the client's progress page automatically.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto">
            <tr><td style="background:#1A56DB;border-radius:12px;padding:14px 32px;text-align:center">
              <a href="${BASE_URL}/snags" style="color:#fff;font-size:15px;font-weight:700;text-decoration:none">Open SnagIT →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 0;text-align:center">
          <p style="margin:0;font-size:11px;color:#CBD5E1">snagitapp.co.za</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch(() => {}) // non-blocking — question is saved regardless
  }

  return NextResponse.json(question, { status: 201 })
}
