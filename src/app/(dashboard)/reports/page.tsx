import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { DASHBOARD_TERMS } from '@/types'
import type { OrgType } from '@/types'
import { waLink } from '@/lib/whatsappLink'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('organizations(org_type)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const raw = orgMember?.organizations
  const org = Array.isArray(raw) ? raw[0] : raw as { org_type?: string } | null | undefined
  const terms = DASHBOARD_TERMS[(org?.org_type ?? 'builder') as OrgType]

  const [{ data: stats }, { data: clientInfo }] = await Promise.all([
    supabase.from('snag_stats_by_project').select('*').order('project_name'),
    supabase.from('projects').select('id, client_whatsapp, share_token, client_name'),
  ])

  const clientMap = new Map(
    (clientInfo ?? []).map(p => [p.id, p])
  )

  const rows = stats ?? []
  const totals = rows.reduce(
    (t, r) => ({
      total: t.total + Number(r.total_snags ?? 0),
      open: t.open + Number(r.open_snags ?? 0),
      progress: t.progress + Number(r.in_progress_snags ?? 0),
      resolved: t.resolved + Number(r.resolved_snags ?? 0),
      critical: t.critical + Number(r.critical_snags ?? 0),
    }),
    { total: 0, open: 0, progress: 0, resolved: 0, critical: 0 }
  )

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
      <p className="mb-5 text-sm text-slate-500">{terms.issue} progress across all {terms.projects.toLowerCase()}.</p>

      {/* Org totals */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: totals.total, color: 'text-slate-900' },
          { label: 'Open', value: totals.open, color: 'text-red-600' },
          { label: 'Busy', value: totals.progress, color: 'text-blue-600' },
          { label: 'Done', value: totals.resolved, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="sf-card p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="sf-card flex flex-col items-center p-10 text-center">
          <FileText className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-900">Nothing to report yet</p>
          <p className="mt-1 text-sm text-slate-500">Stats appear here as soon as you log {terms.issues.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            const client = clientMap.get(r.project_id)
            const canShare = !!client?.share_token
            const shareUrl = canShare
              ? `https://snagitapp.co.za/share/${client!.share_token}`
              : null
            const waHref = canShare
              ? waLink(
                  null,
                  `Hi ${client!.client_name || 'there'}, here's your live snagging progress for *${r.project_name}*:\n\n${shareUrl}\n\nView all snags, status and photos in real time.`
                )
              : null

            const WA_SVG = (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            )

            return (
              <div key={r.project_id} className="sf-card p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/projects/${r.project_id}`} className="flex-1 min-w-0 hover:opacity-75 transition-opacity">
                    <p className="text-sm font-semibold text-slate-900">{r.project_name}</p>
                  </Link>
                  <p className="text-sm font-bold text-slate-700 ml-3 flex-shrink-0">{r.completion_pct ?? 0}%</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#1A56DB]" style={{ width: `${r.completion_pct ?? 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {r.total_snags} {terms.issues.toLowerCase()} · {r.open_snags} open · {r.in_progress_snags} in progress · {r.resolved_snags} resolved
                  {Number(r.critical_snags) > 0 && <span className="font-medium text-red-600"> · {r.critical_snags} critical</span>}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  {waHref ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-[transform,opacity] hover:opacity-90"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      {WA_SVG}
                      Send progress to client
                    </a>
                  ) : (
                    <Link
                      href={`/projects/${r.project_id}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2.5 text-sm font-medium text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {WA_SVG}
                      Set up client link to enable sharing
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
