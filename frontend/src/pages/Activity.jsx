/*
  Activity.jsx – Global Execution Activity Feed
  Route: /activity

  Shows all workflow executions across every workflow — sorted by most recent.
  Click any row to see step-level details in a side drawer.
*/

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/ui/dashboard-sidebar'
import { T } from '../theme'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Layers,
  ArrowRight,
  X,
  Zap,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function duration(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end) - new Date(start)
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const ok = status === 'completed'
  const running = status === 'running'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
      ok      ? 'bg-green-500/12 text-green-400 border border-green-500/20'
      : running ? 'bg-orange-500/12 text-orange-400 border border-orange-500/20'
                : 'bg-red-500/12 text-red-400 border border-red-500/20'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        ok ? 'bg-green-400' : running ? 'bg-orange-400 animate-pulse' : 'bg-red-400'
      }`} />
      {status}
    </span>
  )
}

// ── Step drawer ───────────────────────────────────────────────────────────────
function StepDrawer({ ex, workflowName, onClose, t, dark }) {
  return (
    <div className="absolute inset-0 z-30 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`w-[440px] ${t.bgPanel} border-l ${t.border} flex flex-col h-full overflow-hidden shadow-2xl`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b ${t.border} flex items-start justify-between shrink-0`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={ex.status} />
              <span className={`${t.textFaint} text-xs font-mono`}>#{ex.id}</span>
            </div>
            <p className={`${t.textPrimary} font-semibold text-sm`}>{workflowName || 'Workflow'}</p>
            <p className={`${t.textFaint} text-xs mt-0.5`}>{fmt(ex.started_at)}</p>
          </div>
          <button onClick={onClose} className={`${t.textFaint} hover:${t.textSecondary} transition-colors p-1 rounded-lg ${t.sectionHover}`}>
            <X size={16} />
          </button>
        </div>

        {/* Summary chips */}
        <div className={`px-5 py-3 flex gap-2 border-b ${t.border} shrink-0 flex-wrap`}>
          <span className={`text-xs ${t.textMuted} ${t.bgInput} border ${t.border} px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
            <Layers size={11} /> {ex.steps?.length ?? 0} steps
          </span>
          <span className={`text-xs ${t.textMuted} ${t.bgInput} border ${t.border} px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
            <Clock size={11} /> {duration(ex.started_at, ex.finished_at)}
          </span>
        </div>

        {/* Error banner */}
        {ex.error && (
          <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl shrink-0">
            <p className="text-red-400 text-xs font-mono leading-relaxed">{ex.error}</p>
          </div>
        )}

        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {(ex.steps || []).map((step, i) => {
            const ok = !step.error
            return (
              <div key={i} className={`rounded-xl border overflow-hidden ${ok ? t.border : 'border-red-500/25'}`}>
                <div className={`flex items-center gap-2.5 px-3 py-2 ${ok ? t.bgInfo : 'bg-red-500/10'}`}>
                  {ok
                    ? <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                    : <XCircle size={13} className="text-red-400 shrink-0" />
                  }
                  <span className={`${t.textPrimary} text-sm font-medium flex-1`}>{step.label}</span>
                  <span className={`${t.textFaint} text-[10px] font-mono`}>{step.type}</span>
                </div>
                <div className={`px-3 py-2.5 ${t.bgCode}`}>
                  {step.error && <p className="text-red-400 text-xs font-mono">{step.error}</p>}
                  {!step.error && step.output && Object.keys(step.output).length > 0 && (
                    <pre className={`${t.textMuted} text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed`}>
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  )}
                  {!step.error && (!step.output || Object.keys(step.output).length === 0) && (
                    <p className={`${t.textFaint} text-xs italic`}>No output</p>
                  )}
                </div>
              </div>
            )
          })}
          {(!ex.steps || ex.steps.length === 0) && (
            <p className={`${t.textFaint} text-xs italic py-4 text-center`}>No step details available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, t }) {
  return (
    <div className={`${t.bgCard} border ${t.borderCard} rounded-xl p-4 flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-xl ${t.bgInput} border ${t.border} flex items-center justify-center shrink-0`}>
        <Icon size={18} className="text-orange-400" />
      </div>
      <div className="min-w-0">
        <p className={`${t.textPrimary} text-xl font-bold`}>{value}</p>
        <p className={`${t.textFaint} text-xs`}>{label}</p>
        {sub && <p className="text-orange-400 text-xs font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ActivityPage() {
  const navigate = useNavigate()

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('flowDarkMode')
    return saved === null ? true : saved === 'true'
  })
  const toggleDark = useCallback(() => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem('flowDarkMode', String(next))
      return next
    })
  }, [])
  const t = dark ? T.dark : T.light

  const [activeNav,  setActiveNav]  = useState('activity')
  const [workflows,  setWorkflows]  = useState([])
  const [executions, setExecutions] = useState([])  // [{...exec, workflowName, workflowId}]
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [filterWf,   setFilterWf]   = useState('all')

  const userName = localStorage.getItem('userName') || ''
  const logout   = () => { localStorage.removeItem('token'); localStorage.removeItem('userName'); navigate('/login') }

  // Load all workflows, then fetch executions for each
  const load = useCallback(async (quiet = false) => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    if (!quiet) setLoading(true)
    else setRefreshing(true)

    try {
      const wfRes = await fetch(`${API}/workflows/`, { headers: authHeaders() })
      if (wfRes.status === 401) { localStorage.removeItem('token'); navigate('/login'); return }
      const wfData = await wfRes.json()
      const wfs    = Array.isArray(wfData) ? wfData : []
      setWorkflows(wfs)

      // Fetch executions for all workflows in parallel
      const results = await Promise.allSettled(
        wfs.map(wf =>
          fetch(`${API}/workflows/${wf.id}/executions`, { headers: authHeaders() })
            .then(r => r.json())
            .then(execs => (Array.isArray(execs) ? execs : []).map(ex => ({
              ...ex,
              workflowId:   wf.id,
              workflowName: wf.name,
            })))
        )
      )

      const all = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))

      setExecutions(all)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => { load() }, [load])

  // Derived stats
  const completed = executions.filter(e => e.status === 'completed').length
  const failed    = executions.filter(e => e.status === 'failed').length
  const successPct = executions.length ? Math.round((completed / executions.length) * 100) : 0

  const filtered = filterWf === 'all'
    ? executions
    : executions.filter(e => String(e.workflowId) === filterWf)

  return (
    <DashboardLayout
      activeId={activeNav}
      onSelect={setActiveNav}
      userName={userName}
      onLogout={logout}
      breadcrumb="Activity"
      dark={dark}
      onToggleDark={toggleDark}
    >
      <div className={`min-h-full ${t.bg} transition-colors duration-200 relative`}>
        <div className="p-6 md:p-8">

          {/* Page header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className={`text-xl font-bold ${t.textPrimary}`}>Activity</h1>
              <p className={`${t.textMuted} text-sm mt-0.5`}>All workflow execution history</p>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className={`flex items-center gap-2 px-3.5 py-2 ${t.bgInput} border ${t.border} ${t.textSecondary} text-sm rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50`}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            <StatCard label="Total Runs"      value={executions.length} icon={Zap}           t={t} />
            <StatCard label="Completed"       value={completed}         icon={CheckCircle2}   t={t} />
            <StatCard label="Failed"          value={failed}            icon={XCircle}        t={t} />
            <StatCard label="Success Rate"    value={`${successPct}%`}  icon={Activity}       t={t}
              sub={executions.length ? `${completed}/${executions.length}` : undefined} />
          </div>

          {/* Filter row */}
          {workflows.length > 1 && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className={`${t.textFaint} text-xs font-semibold uppercase tracking-widest`}>Filter:</span>
              <button
                onClick={() => setFilterWf('all')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                  filterWf === 'all'
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                    : `${t.bgInput} ${t.border} ${t.textMuted} hover:opacity-80`
                }`}
              >
                All workflows
              </button>
              {workflows.map(wf => (
                <button
                  key={wf.id}
                  onClick={() => setFilterWf(String(wf.id))}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium truncate max-w-[160px] ${
                    filterWf === String(wf.id)
                      ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                      : `${t.bgInput} ${t.border} ${t.textMuted} hover:opacity-80`
                  }`}
                >
                  {wf.name}
                </button>
              ))}
            </div>
          )}

          {/* Executions table */}
          <div className={`${t.bgCard} rounded-2xl border ${t.borderCard} overflow-hidden`}>
            {/* Table header */}
            <div className={`px-6 py-3.5 border-b ${t.border} flex items-center justify-between`}>
              <h3 className={`${t.textPrimary} font-semibold text-sm`}>Executions</h3>
              <span className={`${t.textFaint} text-xs font-mono`}>{filtered.length} runs</span>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20 gap-3">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className={`${t.textMuted} text-sm`}>Loading activity…</span>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
                <div className={`w-14 h-14 rounded-2xl ${t.bgInput} border ${t.border} flex items-center justify-center`}>
                  <Activity size={24} className={t.textFaint} />
                </div>
                <div>
                  <p className={`${t.textSecondary} font-medium text-sm mb-1`}>No executions yet</p>
                  <p className={`${t.textFaint} text-xs`}>
                    Run a workflow from the editor to see its history here.
                  </p>
                </div>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors"
                >
                  Go to My Workflows <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className={`sticky top-0 ${t.bgPanel} z-10`}>
                    <tr className={`border-b ${t.border}`}>
                      {['#', 'Workflow', 'Status', 'Started', 'Duration', 'Steps', ''].map(h => (
                        <th key={h} className={`text-left text-[10px] font-bold uppercase tracking-widest ${t.textFaint} px-5 py-3`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(ex => {
                      const ok      = ex.status === 'completed'
                      const running = ex.status === 'running'
                      return (
                        <tr
                          key={`${ex.workflowId}-${ex.id}`}
                          className={`border-b ${dark ? 'border-white/[0.04]' : 'border-black/[0.04]'} ${t.sectionHover} transition-colors group cursor-pointer`}
                          onClick={() => setSelected(ex)}
                        >
                          {/* ID */}
                          <td className={`px-5 py-3.5 ${t.textFaint} font-mono text-xs`}>
                            #{ex.id}
                          </td>

                          {/* Workflow name */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5">
                                  <circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/>
                                  <line x1="8" y1="12" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="17"/>
                                </svg>
                              </div>
                              <span className={`${t.textSecondary} text-sm font-medium group-hover:text-orange-400 transition-colors truncate max-w-[180px]`}>
                                {ex.workflowName}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <StatusBadge status={ex.status} />
                          </td>

                          {/* Started */}
                          <td className={`px-5 py-3.5 ${t.textMuted} text-xs`}>
                            {timeAgo(ex.started_at)}
                          </td>

                          {/* Duration */}
                          <td className={`px-5 py-3.5 ${t.textMuted} text-xs font-mono`}>
                            {duration(ex.started_at, ex.finished_at)}
                          </td>

                          {/* Steps */}
                          <td className={`px-5 py-3.5 ${t.textMuted} text-xs font-mono`}>
                            {ex.steps?.length ?? 0}
                          </td>

                          {/* View */}
                          <td className="px-5 py-3.5">
                            <ChevronRight
                              size={15}
                              className={`${t.textFaint} group-hover:text-orange-400 transition-colors`}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Step detail drawer */}
        {selected && (
          <StepDrawer
            ex={selected}
            workflowName={selected.workflowName}
            onClose={() => setSelected(null)}
            t={t}
            dark={dark}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
