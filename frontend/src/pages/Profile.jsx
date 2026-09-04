import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/ui/dashboard-sidebar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

export default function Profile() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [user,      setUser]      = useState(null)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [workflows, setWorkflows] = useState([])

  // Edit state
  const [editing,   setEditing]   = useState(false)
  const [editName,  setEditName]  = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saveMsg,   setSaveMsg]   = useState('')

  // Import state
  const [importing, setImporting] = useState(false)

  // ── Load profile ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    fetch(`${API}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('token'); navigate('/login'); return null }
        return r.json()
      })
      .then(data => {
        if (data) { setUser(data); setEditName(data.name); setEditEmail(data.email) }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [navigate])

  // ── Load workflows ────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${API}/workflows/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setWorkflows(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // ── Save profile ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setSaveMsg('')
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: editName, email: editEmail }),
      })
      if (!res.ok) {
        const err = await res.json()
        setSaveMsg(err.detail || 'Failed to update')
        return
      }
      const data = await res.json()
      setUser(data)
      setEditing(false)
      setSaveMsg('Profile updated!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch {
      setSaveMsg('Network error')
    } finally {
      setSaving(false)
    }
  }

  // ── Import workflow JSON ──────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)

      // Validate basic structure
      if (!json.nodes && !json.edges) {
        alert('Invalid workflow JSON: missing nodes/edges')
        return
      }

      // Create a new workflow with the imported JSON
      const res = await fetch(`${API}/workflows/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: file.name.replace('.json', ''),
          description: 'Imported from JSON file',
          workflow_json: {
            nodes: json.nodes || [],
            edges: json.edges || [],
          },
        }),
      })

      if (!res.ok) throw new Error('Failed to create workflow')
      const wf = await res.json()
      navigate(`/flow/${wf.id}`)
    } catch (err) {
      alert(`Import failed: ${err.message}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('userName'); navigate('/login') }
  const [activeNav, setActiveNav] = useState('profile')

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</div>
      </div>
    )
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? '?'
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <DashboardLayout
      activeId={activeNav}
      onSelect={setActiveNav}
      userName={user?.name}
      onLogout={logout}
      breadcrumb="Profile"
    >
      <div className="p-6 md:p-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">Profile</h1>
            <p className="text-white/30 text-sm mt-0.5">Manage your account settings</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-3xl">

          {/* ── Profile card ── */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.07] overflow-hidden">

            {/* Banner gradient */}
            <div className="h-24 bg-gradient-to-r from-orange-600/25 via-orange-500/10 to-amber-600/15" />

            {/* Avatar & name */}
            <div className="px-6 -mt-8 pb-6">
              <div className="flex items-end gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700
                  flex items-center justify-center text-white text-xl font-bold
                  border-4 border-[#0a0a0a] shadow-xl">
                  {initial}
                </div>
                <div className="pb-1">
                  <h2 className="text-lg font-bold text-white">{user?.name}</h2>
                  <p className="text-white/40 text-sm">{user?.email}</p>
                </div>

                {!editing && (
                  <button onClick={() => setEditing(true)}
                    className="ml-auto mb-1 px-4 py-1.5 bg-white/5 border border-white/10 text-white/60
                      text-sm rounded-lg hover:bg-white/10 hover:text-white/90 transition-colors
                      flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>

              {/* Info table */}
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] divide-y divide-white/[0.06]">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-white/40 text-sm">User ID</span>
                  <span className="text-white/70 text-sm font-mono">#{user?.id}</span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-white/40 text-sm">Name</span>
                  {editing ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm
                        w-60 focus:outline-none focus:border-orange-500/50" />
                  ) : (
                    <span className="text-white/80 text-sm">{user?.name}</span>
                  )}
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-white/40 text-sm">Email</span>
                  {editing ? (
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm
                        w-60 focus:outline-none focus:border-orange-500/50" />
                  ) : (
                    <span className="text-white/80 text-sm">{user?.email}</span>
                  )}
                </div>

                {joinDate && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-white/40 text-sm">Joined</span>
                    <span className="text-white/60 text-sm">{joinDate}</span>
                  </div>
                )}

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-white/40 text-sm">Workflows</span>
                  <span className="text-white/60 text-sm font-mono">{workflows.length}</span>
                </div>
              </div>

              {/* Save / Cancel buttons (edit mode) */}
              {editing && (
                <div className="flex items-center gap-3 mt-4">
                  <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold
                      rounded-lg transition-colors disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button onClick={() => {
                    setEditing(false); setEditName(user.name); setEditEmail(user.email); setSaveMsg('')
                  }}
                    className="px-5 py-2 bg-white/5 border border-white/10 text-white/60 text-sm
                      rounded-lg hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                </div>
              )}

              {/* Status message */}
              {saveMsg && (
                <p className={`mt-3 text-sm ${saveMsg.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>
                  {saveMsg}
                </p>
              )}
            </div>
          </div>

          {/* ── Import Workflow card ── */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.07] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Load Workflow</h3>
                <p className="text-white/40 text-xs">Import a workflow from a JSON file</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-json"
              />
              <button onClick={() => fileRef.current?.click()} disabled={importing}
                className="px-5 py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400
                  text-sm font-semibold rounded-xl hover:bg-orange-500/20 transition-colors
                  disabled:opacity-50 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {importing ? 'Importing…' : 'Choose JSON File'}
              </button>
              <p className="text-white/25 text-xs">
                Accepts exported workflow .json files
              </p>
            </div>
          </div>

          {/* ── Recent workflows ── */}
          {workflows.length > 0 && (
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.07] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-white font-semibold text-sm">Your Workflows</h3>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {workflows.slice(0, 10).map(wf => (
                  <Link key={wf.id} to={`/flow/${wf.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <span className="text-white/80 text-sm font-medium">{wf.name}</span>
                      {wf.description && (
                        <p className="text-white/30 text-xs mt-0.5">{wf.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/25 text-xs">
                        {new Date(wf.created_at).toLocaleDateString()}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" className="text-white/20">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  )
}
