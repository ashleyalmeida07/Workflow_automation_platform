import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/ui/dashboard-sidebar'
import { Plus } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ── Workflow Modal ────────────────────────────────────────────────────────────

function WorkflowModal({ existing, onClose, onSave }) {
  const [name, setName] = useState(existing?.name ?? '')
  const [desc, setDesc] = useState(existing?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    const isEdit = !!existing
    const url = isEdit ? `${API}/workflows/${existing.id}` : `${API}/workflows/`
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          description: desc.trim() || null,
          workflow_json: existing?.workflow_json ?? { nodes: [], edges: [] },
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Failed to save'); return }
      onSave(data, isEdit)
    } catch { setError('Could not connect to server') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-4">{existing ? 'Edit Workflow' : 'New Workflow'}</h2>
        {error && <div className="text-red-400 text-sm bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-2 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider mb-1.5">Workflow Name *</label>
            <input
              id="workflow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition"
              placeholder="e.g. Send Slack on new lead"
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              id="workflow-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition resize-none"
              placeholder="What does this workflow do?"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/50 bg-white/5 hover:bg-white/10 border border-white/10 transition">Cancel</button>
            <button
              id="save-workflow-btn"
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-400 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : existing ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ wf, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  const handleDelete = async () => { setDeleting(true); await onConfirm(wf.id); setDeleting(false) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800/50 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </div>
        <h2 className="text-white font-bold text-center mb-1">Delete Workflow?</h2>
        <p className="text-white/40 text-sm text-center mb-6"><span className="text-white/70 font-medium">"{wf.name}"</span> will be permanently deleted.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/50 bg-white/5 hover:bg-white/10 border border-white/10 transition">Cancel</button>
          <button id="confirm-delete-btn" onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-700 hover:bg-red-600 transition disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Workflow Card ─────────────────────────────────────────────────────────────

function WorkflowCard({ wf, onEdit, onDelete, onOpen }) {
  const nodeCount = wf.workflow_json?.nodes?.length ?? 0
  const edgeCount = wf.workflow_json?.edges?.length ?? 0

  return (
    <div className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.07] hover:border-orange-500/30 rounded-xl p-5 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
            <circle cx="6" cy="12" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="18" cy="18" r="2" />
            <line x1="8" y1="12" x2="16" y2="7" /><line x1="8" y1="12" x2="16" y2="17" />
          </svg>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(wf)} title="Edit" className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={() => onDelete(wf)} title="Delete" className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-950/30 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="text-white font-semibold text-sm mb-1 truncate">{wf.name}</h3>
      <p className="text-white/30 text-xs mb-4 truncate">{wf.description || 'No description'}</p>

      <div className="flex gap-2 mb-4">
        <span className="text-xs text-white/30 bg-white/[0.04] rounded-md px-2 py-1">{nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}</span>
        <span className="text-xs text-white/30 bg-white/[0.04] rounded-md px-2 py-1">{edgeCount} {edgeCount === 1 ? 'edge' : 'edges'}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/20">{timeAgo(wf.updated_at || wf.created_at)}</span>
        <button
          onClick={() => onOpen(wf)}
          className="text-xs text-orange-400 hover:text-orange-300 font-medium transition flex items-center gap-1"
        >
          Open editor
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  // Seed with cached name instantly so sidebar doesn't flash "..." on every load
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('userName')
    return cached ? { name: cached } : null
  })
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [activeNav, setActiveNav] = useState('dashboard')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    Promise.all([
      fetch(`${API}/auth/profile`, { headers: authHeaders() }),
      fetch(`${API}/workflows/`, { headers: authHeaders() }),
    ])
      .then(async ([uRes, wRes]) => {
        if (uRes.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('userName'); navigate('/login'); return }
        const [userData, workflowData] = await Promise.all([uRes.json(), wRes.json()])
        setUser(userData)
        // Keep cache in sync
        if (userData?.name) localStorage.setItem('userName', userData.name)
        setWorkflows(Array.isArray(workflowData) ? workflowData : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // run once on mount only — navigate is stable but listing it causes re-fetch loops

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('userName'); navigate('/login') }

  const handleSave = (saved, isEdit) => {
    if (isEdit) { setWorkflows(prev => prev.map(w => w.id === saved.id ? saved : w)); setEditTarget(null) }
    else { setWorkflows(prev => [saved, ...prev]); setShowCreate(false) }
  }

  const handleDelete = async (id) => {
    await fetch(`${API}/workflows/${id}`, { method: 'DELETE', headers: authHeaders() })
    setWorkflows(prev => prev.filter(w => w.id !== id))
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      activeId={activeNav}
      onSelect={setActiveNav}
      userName={user?.name}
      onLogout={logout}
      breadcrumb="My Workflows"
    >
      <div className="p-6 md:p-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">My Workflows</h1>
            <p className="text-white/30 text-sm mt-0.5">
              {workflows.length === 0
                ? 'No workflows yet — create your first one'
                : `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            id="new-workflow-btn"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-400 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New Workflow
          </button>
        </div>

        {/* Workflows grid / empty state */}
        {workflows.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5">
                <circle cx="6" cy="12" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="18" cy="18" r="2" />
                <line x1="8" y1="12" x2="16" y2="7" /><line x1="8" y1="12" x2="16" y2="17" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">No workflows yet</h3>
            <p className="text-white/30 text-sm mb-6">Click "New Workflow" to start automating</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-400 transition-colors"
            >
              Create your first workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map(wf => (
              <WorkflowCard
                key={wf.id}
                wf={wf}
                onEdit={w => setEditTarget(w)}
                onDelete={w => setDeleteTarget(w)}
                onOpen={w => navigate('/flow', { state: { workflowId: w.id } })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && <WorkflowModal onClose={() => setShowCreate(false)} onSave={handleSave} />}
      {editTarget && <WorkflowModal existing={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />}
      {deleteTarget && <DeleteModal wf={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </DashboardLayout>
  )
}
