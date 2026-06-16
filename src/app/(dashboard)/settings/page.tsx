import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, whatsapp, phone, job_title')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('org_members')
    .select('organizations(name, org_type)')
    .eq('user_id', user.id)
    .single()

  const org = Array.isArray(membership?.organizations)
    ? membership.organizations[0]
    : membership?.organizations

  return (
    <SettingsClient
      email={user.email ?? ''}
      profile={profile ?? { full_name: null, whatsapp: null, phone: null, job_title: null }}
      orgName={org?.name ?? null}
      orgType={org?.org_type ?? null}
    />
  )
}
