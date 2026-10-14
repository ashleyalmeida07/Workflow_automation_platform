/*
  Credentials.jsx – Encrypted Credentials Vault page
  Route: /credentials

  Users can save named credential sets (Postgres DB, OpenAI key, etc.)
  Secrets are encrypted on the backend (AES-256-GCM) — the frontend
  never receives raw plaintext values back, only the credential name + type.

  UI:
    - Left list of saved credentials
    - Right panel: Create / Edit form (type-aware field groups)
    - Delete with confirmation
*/

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } })
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  return res
}

// ── Credential type definitions (what fields each type requires) ──────────
const CRED_TYPES = {
  postgres_db: {
    label:  'PostgreSQL Database',
    color:  'indigo',
    icon:   '🗄️',
    fields: [
      { key: 'host',     label: 'Host',          placeholder: 'localhost',  type: 'text'     },
      { key: 'port',     label: 'Port',          placeholder: '5432',       type: 'number'   },
      { key: 'user',     label: 'Username',      placeholder: 'postgres',   type: 'text'     },
      { key: 'password', label: 'Password',      placeholder: '••••••••',   type: 'password' },
      { key: 'dbname',   label: 'Database Name', placeholder: 'mydb',       type: 'text'     },
    ],
  },
  openai: {
    label:  'OpenAI / AI Provider',
    color:  'purple',
    icon:   '🤖',
    fields: [
      { key: 'api_key',  label: 'API Key',       placeholder: 'sk-••••••••', type: 'password' },
      { key: 'base_url', label: 'Base URL (optional override)', placeholder: 'https://api.openai.com/v1', type: 'text' },
    ],
  },
  slack: {
    label:  'Slack Webhook',
    color:  'green',
    icon:   '💬',
    fields: [
      { key: 'webhook_url', label: 'Slack Webhook URL', placeholder: 'https://hooks.slack.com/services/...', type: 'text' },
    ],
  },
  email: {
    label:  'SMTP Email',
    color:  'blue',
    icon:   '📧',
    fields: [
      { key: 'smtp_host',     label: 'SMTP Host',     placeholder: 'smtp.gmail.com', type: 'text'     },
      { key: 'smtp_port',     label: 'SMTP Port',     placeholder: '587',            type: 'number'   },
      { key: 'smtp_user',     label: 'SMTP Username', placeholder: 'you@gmail.com',  type: 'text'     },
      { key: 'smtp_password', label: 'SMTP Password', placeholder: '••••••••',       type: 'password' },
    ],
  },
  http_request: {
    label:  'HTTP Bearer Token',
    color:  'cyan',
    icon:   '🌐',
    fields: [
      { key: 'bearer_token', label: 'Bearer Token', placeholder: 'eyJ...', type: 'password' },
    ],
  },
  generic: {
    label:  'Generic Secret',
    color:  'gray',
    icon:   '🔑',
    fields: [
      { key: 'value', label: 'Secret Value', placeholder: 'Any secret string', type: 'password' },
    ],
  },
}

const COLOR_CLASSES = {
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300', dot: 'bg-indigo-500', badge: 'bg-indigo-500/20 text-indigo-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-500', badge: 'bg-purple-500/20 text-purple-300' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-300',  dot: 'bg-green-500',  badge: 'bg-green-500/20  text-green-300'  },
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300',   dot: 'bg-blue-500',   badge: 'bg-blue-500/20   text-blue-300'   },
  cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-300',   dot: 'bg-cyan-500',   badge: 'bg-cyan-500/20   text-cyan-300'   },
  gray:   { bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   text: 'text-gray-300',   dot: 'bg-gray-400',   badge: 'bg-gray-500/20   text-gray-300'   },
}

const INPUT = 'w-full bg-white/[0.04] border border-white/[0.08] text-white/90 text-sm rounded-xl px-3 py-2 outline-none focus:border-white/25 transition-colors placeholder:text-white/20'
const LABEL = 'text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5 block'

// ── Topbar ────────────────────────────────────────────────────────────────
function Topbar() {
  return (
    <div className="h-14 border-b border-white/[0.06] flex items-center px-5 shrink-0 bg-[#0a0a0a] justify-between z-10">
      <div className="flex items-center gap-3">
        <Link to="/dashboard"
          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
        <span className="text-white/20 text-xs">|</span>
        <span className="text-white font-semibold text-sm flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-yellow-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Credentials Vault
        </span>
      </div>
      <span className="text-white/20 text-xs">Secrets encrypted with AES-256-GCM</span>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-3xl">
        🔐
      </div>
      <div>
        <h3 className="text-white/80 font-semibold text-base mb-1">No credentials yet</h3>
        <p className="text-white/30 text-sm leading-relaxed max-w-xs">
          Save your API keys, database passwords, and tokens here. They're encrypted before storage — nodes can reference them by name.
        </p>
      </div>
      <button onClick={onNew}
        className="px-4 py-2 bg-yellow-500 text-black font-semibold text-sm rounded-xl hover:bg-yellow-400 transition-colors flex items-center gap-2 shadow-lg shadow-yellow-500/20">
        + Add First Credential
      </button>
    </div>
  )
}

// ── Credential list item ──────────────────────────────────────────────────
function CredentialItem({ cred, selected, onClick, onDelete }) {
  const def = CRED_TYPES[cred.credential_type] || CRED_TYPES.generic
  const c   = COLOR_CLASSES[def.color] || COLOR_CLASSES.gray

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/[0.04] transition-all hover:bg-white/[0.03] ${selected ? 'bg-white/[0.06]' : ''}`}
    >
      <span className="text-xl shrink-0">{def.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-sm font-medium truncate">{cred.name}</p>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${c.badge}`}>{def.label}</span>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(cred) }}
        className="text-white/15 hover:text-red-400 transition-colors ml-1 shrink-0"
        title="Delete"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  )
}

// ── Credential form (Create + Edit) ──────────────────────────────────────
function CredentialForm({ initial, onSave, onCancel }) {
  const isEdit = !!initial

  const [name, setName]   = useState(initial?.name || '')
  const [type, setType]   = useState(initial?.credential_type || 'postgres_db')
  const [fields, setFields] = useState({})
  const [saving, setSaving] = useState(false)

  const def = CRED_TYPES[type] || CRED_TYPES.generic

  const handleField = (key, val) => setFields(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Credential name is required'); return }
    const hasValues = Object.values(fields).some(v => v && v.trim())
    if (!hasValues && !isEdit) { toast.error('Please fill in at least one secret field'); return }

    setSaving(true)
    try {
      const body = { name: name.trim(), credential_type: type, secret_fields: fields }
      let res
      if (isEdit) {
        const payload = { name: name.trim() }
        if (hasValues) payload.secret_fields = fields
        res = await apiFetch(`${API}/credentials/${initial.id}`, {
          method: 'PUT', body: JSON.stringify(payload),
        })
      } else {
        res = await apiFetch(`${API}/credentials/`, {
          method: 'POST', body: JSON.stringify(body),
        })
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      toast.success(isEdit ? 'Credential updated' : 'Credential saved & encrypted')
      onSave(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
        <h2 className="text-white font-semibold text-base">
          {isEdit ? `Edit: ${initial.name}` : 'New Credential'}
        </h2>
        <p className="text-white/30 text-xs mt-0.5">
          Secrets are encrypted with AES-256-GCM before being stored.
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className={LABEL}>Credential Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. My Neon DB, OpenAI Production Key"
            className={INPUT} />
        </div>

        {/* Type — only editable on create */}
        {!isEdit && (
          <div>
            <label className={LABEL}>Credential Type</label>
            <select value={type} onChange={e => { setType(e.target.value); setFields({}) }}
              className={INPUT + ' cursor-pointer'}>
              {Object.entries(CRED_TYPES).map(([k, v]) => (
                <option key={k} value={k} className="bg-[#111]">{v.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Type badge on edit */}
        {isEdit && (() => {
          const c = COLOR_CLASSES[def.color] || COLOR_CLASSES.gray
          return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${c.bg} ${c.border}`}>
              <span>{def.icon}</span>
              <span className={`text-xs font-semibold ${c.text}`}>{def.label}</span>
            </div>
          )
        })()}

        {/* Secret fields */}
        <div>
          <label className={LABEL}>
            {isEdit ? 'Update Secret Fields (leave blank to keep existing)' : 'Secret Fields'}
          </label>
          <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            {isEdit && (
              <div className="flex items-center gap-2 text-xs text-yellow-400/70 mb-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Existing values are encrypted. Enter new values to update.
              </div>
            )}
            {def.fields.map(f => (
              <div key={f.key}>
                <label className={LABEL}>{f.label}</label>
                <input
                  type={f.type === 'password' ? 'password' : 'text'}
                  value={fields[f.key] || ''}
                  onChange={e => handleField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={INPUT}
                  autoComplete="new-password"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300/70 leading-relaxed">
          <strong className="text-yellow-300/90 block mb-1">🔒 How encryption works</strong>
          Your secrets are encrypted with <strong>AES-256-GCM</strong> using a key derived from your user account.
          The server never logs plaintext values. When a node runs, secrets are decrypted in-memory only for that execution.
        </div>
      </div>

      {/* Footer buttons */}
      <div className="px-6 py-4 border-t border-white/[0.06] shrink-0 flex items-center gap-3">
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2 bg-yellow-500 text-black font-semibold text-sm rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50 shadow-lg shadow-yellow-500/20">
          {saving ? 'Saving…' : (isEdit ? 'Update Credential' : 'Save & Encrypt')}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 bg-white/5 border border-white/10 text-white/60 text-sm rounded-xl hover:bg-white/10 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────
function DeleteModal({ cred, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-80 flex flex-col gap-4 shadow-2xl">
        <div className="text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h3 className="text-white font-semibold text-base">Delete Credential?</h3>
          <p className="text-white/40 text-sm mt-1 leading-relaxed">
            "<strong className="text-white/70">{cred.name}</strong>" will be permanently deleted.
            Any node using this credential will fail until reconfigured.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-2 bg-white/5 border border-white/10 text-white/60 text-sm rounded-xl hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            disabled={deleting}
            onClick={async () => {
              setDeleting(true)
              await onConfirm()
              setDeleting(false)
            }}
            className="flex-1 py-2 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-400 transition-colors disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Credentials() {
  const [creds,    setCreds]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)   // editing / viewing
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const loadCreds = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/credentials/`)
      if (!res.ok) throw new Error('Failed to load')
      setCreds(await res.json())
    } catch {
      toast.error('Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCreds() }, [loadCreds])

  const handleSave = (saved) => {
    setCreds(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = saved; return next
      }
      return [...prev, saved]
    })
    setCreating(false)
    setSelected(null)
  }

  const handleDelete = async () => {
    try {
      const res = await apiFetch(`${API}/credentials/${toDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setCreds(prev => prev.filter(c => c.id !== toDelete.id))
      toast.success(`"${toDelete.name}" deleted`)
      if (selected?.id === toDelete.id) setSelected(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setToDelete(null)
    }
  }

  const showForm = creating || selected

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      <Topbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: credential list ── */}
        <aside className="w-72 border-r border-white/[0.06] flex flex-col bg-[#0e0e0e] shrink-0">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">
              Saved Credentials {!loading && `(${creds.length})`}
            </span>
            <button
              onClick={() => { setCreating(true); setSelected(null) }}
              className="w-6 h-6 rounded-lg bg-yellow-500 text-black flex items-center justify-center hover:bg-yellow-400 transition-colors font-bold text-sm"
              title="New credential"
            >+</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-20 text-white/20 text-sm">Loading…</div>
            )}
            {!loading && creds.length === 0 && !creating && (
              <EmptyState onNew={() => setCreating(true)} />
            )}
            {creds.map(c => (
              <CredentialItem
                key={c.id}
                cred={c}
                selected={selected?.id === c.id}
                onClick={() => { setSelected(c); setCreating(false) }}
                onDelete={setToDelete}
              />
            ))}
          </div>
        </aside>

        {/* ── Right: form / empty ── */}
        <main className="flex-1 overflow-hidden">
          {showForm ? (
            <CredentialForm
              initial={creating ? null : selected}
              onSave={handleSave}
              onCancel={() => { setCreating(false); setSelected(null) }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-10">
              <div className="text-5xl opacity-20">🔐</div>
              <p className="text-white/20 text-sm">Select a credential to edit, or create a new one.</p>
            </div>
          )}
        </main>
      </div>

      {toDelete && (
        <DeleteModal
          cred={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
