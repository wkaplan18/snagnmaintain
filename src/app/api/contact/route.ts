import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, company, email, phone, properties, message } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error: dbError } = await supabase
    .from('enterprise_enquiries')
    .insert({ name, company, email, phone, properties, message })

  if (dbError) {
    return NextResponse.json({ error: 'Failed to save enquiry' }, { status: 500 })
  }

  const resend = new Resend('re_jNGLrMr3_2L6dQUduYXEVE5ykkFZzVP7R')
  const { error: emailError } = await resend.emails.send({
    from: 'SnagIT <noreply@family.kaplan.co.za>',
    to: 'wkaplan@gmail.com',
    subject: `SnagIT contact: ${name}`,
    html: `<p>Name: ${name}<br>Company: ${company || '—'}<br>Email: ${email}<br>Phone: ${phone || '—'}<br>Properties: ${properties || '—'}<br>Message: ${message || '—'}</p>`,
  })

  if (emailError) {
    console.error('Resend error:', JSON.stringify(emailError))
    return NextResponse.json({ error: `Email failed: ${JSON.stringify(emailError)}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
