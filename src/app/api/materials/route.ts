import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAllUserOrgs, getActiveOrgId } from '@/lib/activeOrg'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'noreply@snagitapp.co.za'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://snagitapp.co.za'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { project_id, item, quantity, urgency = 'normal', notes } = body

  if (!project_id || !item?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const allOrgs = await getAllUserOrgs(user.id)
  const orgId = await getActiveOrgId(user.id, allOrgs)
  if (!orgId) return NextResponse.json({ error: 'No organisation found' }, { status: 403 })

  const admin = createAdminClient()

  const [{ data: org }, { data: project }, { data: profile }] = await Promise.all([
    admin.from('organizations').select('name, email').eq('id', orgId).single(),
    admin.from('projects').select('name').eq('id', project_id).single(),
    admin.from('profiles').select('full_name').eq('id', user.id).single(),
  ])

  const { data: request, error } = await admin
    .from('material_requests')
    .insert({
      org_id: orgId,
      project_id,
      requested_by: user.id,
      item: item.trim(),
      quantity: quantity?.trim() || null,
      urgency,
      notes: notes?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !request) {
    return NextResponse.json({ error: error?.message ?? 'Could not save request' }, { status: 500 })
  }

  if (org?.email) {
    const requesterName = profile?.full_name ?? user.email ?? 'A team member'
    const isUrgent = urgency === 'urgent'
    const projectName = project?.name ?? '—'

    await resend.emails.send({
      from: `SnagIT <${FROM}>`,
      to: org.email,
      subject: `${isUrgent ? '[URGENT] ' : ''}Material request: ${item.trim()} — ${projectName}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
        <tr><td style="background:#fff;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;border-bottom:1px solid #E2E8F0">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px">
            <tr>
              <td style="vertical-align:middle;padding-right:10px">
                <img src="https://snagitapp.co.za/icons/icon-192.png" alt="SnagIT" width="36" height="36" style="border-radius:9px;display:block" />
              </td>
              <td style="vertical-align:middle">
                <p style="margin:0;font-size:18px;font-weight:700;color:#1E293B;letter-spacing:-0.02em">Snag<span style="color:#22C55E">IT</span></p>
              </td>
            </tr>
          </table>
          <p style="margin:0;font-size:20px;font-weight:700;color:#1E293B">Material Request</p>
          <p style="margin:6px 0 0;font-size:13px;color:#64748B">${projectName}</p>
        </td></tr>
        <tr><td style="background:#fff;padding:32px;border-radius:0 0 16px 16px">
          ${isUrgent ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
            <tr><td style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px 16px">
              <p style="margin:0;font-size:14px;font-weight:700;color:#B91C1C">🔴 URGENT REQUEST</p>
            </td></tr>
          </table>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9">
              <p style="margin:0;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em">Item</p>
              <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#1E293B">${item.trim()}</p>
            </td></tr>
            ${quantity?.trim() ? `<tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9">
              <p style="margin:0;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em">Quantity</p>
              <p style="margin:4px 0 0;font-size:15px;color:#334155">${quantity.trim()}</p>
            </td></tr>` : ''}
            <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9">
              <p style="margin:0;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em">Project</p>
              <p style="margin:4px 0 0;font-size:15px;color:#334155">${projectName}</p>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9">
              <p style="margin:0;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em">Requested by</p>
              <p style="margin:4px 0 0;font-size:15px;color:#334155">${requesterName}</p>
            </td></tr>
            <tr><td style="padding:10px 0${notes?.trim() ? ';border-bottom:1px solid #F1F5F9' : ''}">
              <p style="margin:0;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em">Priority</p>
              <p style="margin:4px 0 0;font-size:15px;color:#334155">${isUrgent ? '🔴 Urgent' : 'Normal'}</p>
            </td></tr>
            ${notes?.trim() ? `<tr><td style="padding:10px 0">
              <p style="margin:0;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em">Notes</p>
              <p style="margin:4px 0 0;font-size:14px;color:#475569">${notes.trim()}</p>
            </td></tr>` : ''}
          </table>
          <table cellpadding="0" cellspacing="0" style="margin:28px auto 0">
            <tr><td style="background:#1A56DB;border-radius:12px;padding:14px 32px;text-align:center">
              <a href="${BASE_URL}/materials" style="color:#fff;font-size:15px;font-weight:700;text-decoration:none">View &amp; update in SnagIT →</a>
            </td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.6">
            Don't have a SnagIT account? Ask <strong style="color:#64748B">${org?.name ?? 'your team'}</strong> to invite you<br>so you can mark requests as ordered or fulfilled directly in the app.
          </p>
        </td></tr>
        <tr><td style="padding:16px 0;text-align:center">
          <p style="margin:0;font-size:11px;color:#CBD5E1">SnagIT · snagitapp.co.za</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch(() => {})
  }

  return NextResponse.json({ id: request.id }, { status: 201 })
}
