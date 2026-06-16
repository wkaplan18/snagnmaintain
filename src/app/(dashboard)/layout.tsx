import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/ui/BottomNav'
import { DASHBOARD_TERMS } from '@/types'
import type { OrgType } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let terms = DASHBOARD_TERMS['builder']

  if (user) {
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('organizations(org_type)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const raw = orgMember?.organizations
    const org = Array.isArray(raw) ? raw[0] : raw as { org_type?: string } | null | undefined

    const orgType = (org?.org_type ?? 'builder') as OrgType
    terms = DASHBOARD_TERMS[orgType]
  }

  return (
    <div className="relative min-h-screen pt-safe">
      {children}
      <BottomNav terms={terms} />
    </div>
  )
}
