/*
  Credentials.jsx – Encrypted Credentials Vault
  Route: /credentials

  Secrets are encrypted on the backend (AES-256-GCM) — the frontend
  never receives raw plaintext values back, only the credential name + type.
*/

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/ui/dashboard-sidebar'
import { T } from '../theme'
import toast from 'react-hot-toast'
import {
  KeyRound,
  Database,
  Bot,
  MessageSquare,
  Mail,
  Globe,
  Lock,
  Plus,
  Trash2,
  ShieldCheck,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react'

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

// ── Credential type definitions ───────────────────────────────────────────────
const CRED_TYPES = {
  postgres_db: {
    label:  'PostgreSQL Database',
    color:  'indigo',
    Icon:   Database,
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
    color:  'violet',
    Icon:   Bot,
    fields: [
      { key: 'api_key',  label: 'API Key',                     placeholder: 'sk-••••••••',                    type: 'password' },
      { key: 'base_url', label: 'Base URL (optional override)', placeholder: 'https://api.openai.com/v1',      type: 'text'     },
    ],
  },
  slack: {
    label:  'Slack Webhook',
    color:  'green',
    Icon:   MessageSquare,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...', type: 'text' },
    ],
  },
  email: {
    label:  'SMTP Email',
    color:  'blue',
    Icon:   Mail,
    fields: [
      { key: 'smtp_host',     label: 'SMTP Host',     placeholder: 'smtp.gmail.com', type: 'text'     },
      { key: 'smtp_port',     label: 'SMTP Port',     placeholder: '587',            type: 'number'   },
      { key: 'smtp_user',     label: 'Username',      placeholder: 'you@gmail.com',  type: 'text'     },
      { key: 'smtp_password', label: 'Password',      placeholder: '••••••••',       type: 'password' },
    ],
  },
  http_request: {
    label:  'HTTP Bearer Token',
    color:  'cyan',
    Icon:   Globe,
    fields: [
      { key: 'bearer_token', label: 'Bearer Token', placeholder: 'eyJ...', type: 'password' },
    ],
  },
  generic: {
    label:  'Generic Secret',
    color:  'gray',
    Icon:   Lock,
    fields: [
      { key: 'value', label: 'Secret Value', placeholder: 'Any secret string', type: 'password' },
    ],
  },
}

// Color map — dark-mode safe
const COLORS = {
  indigo: { pill: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  violet: { pill: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  green:  { pill: 'bg-green-500/10  text-green-400  border-green-500/20',  icon: 'bg-green-500/10  text-green-400  border-green-500/20'  },
  blue:   { pill: 'bg-blue-500/10   text-blue-400   border-blue-500/20',   icon: 'bg-blue-500/10   text-blue-400   border-blue-500/20'   },
  cyan:   { pill: 'bg-cyan-500/10   text-cyan-400   border-cyan-500/20',   icon: 'bg-cyan-500/10   text-cyan-400   border-cyan-500/20'   },
  gray:   { pill: 'bg-gray-500/10   text-gray-400   border-gray-500/20',   icon: 'bg-gray-500/10   text-gray-400   border-gray-500/20'   },
}

// ── PasswordInput ─────────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, className }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
        className={className + ' pr-10'}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-current opacity-40 hover:opacity-70 transition-opacity"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

// ── CredentialItem ────────────────────────────────────────────────────────────
function CredentialItem({ cred, selected, onClick, onDelete, t, dark }) {
  const def = CRED_TYPES[cred.credential_type] || CRED_TYPES.generic
  const c   = COLORS[def.color] || COLORS.gray

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b ${
        dark ? 'border-white/[0.04]' : 'border-black/[0.04]'
      } ${selected
        ? dark ? 'bg-orange-500/8' : 'bg-orange-500/5'
        : t.sectionHover
      }`}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${c.icon}`}>
        <def.Icon size={14} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`${t.textSecondary} text-sm font-medium truncate ${selected ? 'text-orange-400' : 'group-hover:text-orange-400 transition-colors'}`}>
          {cred.name}
        </p>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${c.pill}`}>
          {def.label}
        </span>
      </div>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(cred) }}
        className={`opacity-0 group-hover:opacity-100 ${t.textFaint} hover:text-red-400 transition-all ml-1 shrink-0`}
        title="Delete"
      >
        <Trash2 size={14} />
      </button>

      {selected && <ChevronRight size={14} className="text-orange-400 shrink-0" />}
    </div>
  )
}

// ── CredentialForm ────────────────────────────────────────────────────────────
function CredentialForm({ initial, onSave, onCancel, t, dark }) {
  const isEdit = !!initial
  const [name,   setName]   = useState(initial?.name || '')
  const [type,   setType]   = useState(initial?.credential_type || 'postgres_db')
  const [fields, setFields] = useState({})
  const [saving, setSaving] = useState(false)

  const def = CRED_TYPES[type] || CRED_TYPES.generic
  const c   = COLORS[def.color] || COLORS.gray

  const handleField = (key, val) => setFields(prev => ({ ...prev, [key]: val }))

  const inputCls = `w-full ${t.bgInput} border ${t.borderInput} ${t.textPrimary} text-sm rounded-xl px-3 py-2.5 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all ${t.textPlaceholder}`
  const labelCls = `${t.textFaint} text-[10px] font-bold uppercase tracking-widest mb-1.5 block`

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Credential name is required'); return }
    const hasValues = Object.values(fields).some(v => v && v.trim())
    if (!hasValues && !isEdit) { toast.error('Please fill in at least one secret field'); return }

    setSaving(true)
    try {
      let res
      if (isEdit) {
        const payload = { name: name.trim() }
        if (hasValues) payload.secret_fields = fields
        res = await apiFetch(`${API}/credentials/${initial.id}`, {
          method: 'PUT', body: JSON.stringify(payload),
        })
      } else {
        res = await apiFetch(`${API}/credentials/`, {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), credential_type: type, secret_fields: fields }),
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-5 border-b ${t.border} shrink-0`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${c.icon}`}>
            <def.Icon size={16} />
          </div>
          <div>
            <h2 className={`${t.textPrimary} font-semibold text-base`}>
              {isEdit ? `Edit: ${initial.name}` : 'New Credential'}
            </h2>
            <p className={`${t.textFaint} text-xs mt-0.5`}>
              Secrets are encrypted with AES-256-GCM before storage
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

        {/* Name */}
        <div>
          <label className={labelCls}>Credential Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. My Neon DB, OpenAI Production Key"
            className={inputCls}
          />
        </div>

        {/* Type selector (create only) */}
        {!isEdit && (
          <div>
            <label className={labelCls}>Credential Type</label>
            <select
              value={type}
              onChange={e => { setType(e.target.value); setFields({}) }}
              className={inputCls + ' cursor-pointer'}
            >
              {Object.entries(CRED_TYPES).map(([k, v]) => (
                <option key={k} value={k} className={dark ? 'bg-[#111]' : 'bg-white'}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Type badge (edit only) */}
        {isEdit && (
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${c.icon}`}>
            <def.Icon size={15} />
            <span className="text-xs font-semibold">{def.label}</span>
          </div>
        )}

        {/* Secret fields */}
        <div>
          <label className={labelCls}>
            {isEdit ? 'Update Secret Fields (leave blank to keep existing)' : 'Secret Fields'}
          </label>
          <div className={`flex flex-col gap-4 p-4 ${dark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'} rounded-xl border ${t.border}`}>
            {isEdit && (
              <div className={`flex items-center gap-2 text-xs ${dark ? 'text-orange-400/70' : 'text-orange-600/70'}`}>
                <Lock size={12} />
                Existing values are encrypted — enter new values to update them.
              </div>
            )}
            {def.fields.map(f => (
              <div key={f.key}>
                <label className={labelCls}>{f.label}</label>
                {f.type === 'password' ? (
                  <PasswordInput
                    value={fields[f.key] || ''}
                    onChange={e => handleField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                ) : (
                  <input
                    type={f.type}
                    value={fields[f.key] || ''}
                    onChange={e => handleField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Encryption note */}
        <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${
          dark ? 'bg-orange-500/5 border-orange-500/15' : 'bg-orange-500/5 border-orange-500/20'
        }`}>
          <ShieldCheck size={15} className="text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className={`text-xs font-semibold ${dark ? 'text-orange-300/90' : 'text-orange-600'} mb-1`}>
              How encryption works
            </p>
            <p className={`text-xs leading-relaxed ${dark ? 'text-orange-300/60' : 'text-orange-700/70'}`}>
              Secrets are encrypted with <strong>AES-256-GCM</strong> using a key derived from your account.
              The server never logs plaintext values. Secrets are decrypted in-memory only during execution.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-6 py-4 border-t ${t.border} shrink-0 flex items-center gap-3`}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Update Credential' : 'Save & Encrypt'}
        </button>
        <button
          onClick={onCancel}
          className={`px-5 py-2.5 ${t.bgInput} border ${t.border} ${t.textMuted} text-sm rounded-xl hover:opacity-80 transition-opacity`}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteModal({ cred, onConfirm, onCancel, t }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full max-w-sm ${t.bgPanel} border ${t.border} rounded-2xl p-6 shadow-2xl flex flex-col gap-5`}>
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <div className="text-center">
          <h3 className={`${t.textPrimary} font-semibold text-base mb-1`}>Delete Credential?</h3>
          <p className={`${t.textMuted} text-sm leading-relaxed`}>
            <span className={`${t.textSecondary} font-medium`}>"{cred.name}"</span> will be permanently deleted.
            Any node using this credential will fail until reconfigured.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className={`flex-1 py-2.5 ${t.bgInput} border ${t.border} ${t.textMuted} text-sm rounded-xl hover:opacity-80 transition-opacity`}
          >
            Cancel
          </button>
          <button
            disabled={deleting}
            onClick={async () => { setDeleting(true); await onConfirm(); setDeleting(false) }}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyPane({ onNew, t }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-10 text-center">
      <div className={`w-16 h-16 rounded-2xl ${t.bgInput} border ${t.border} flex items-center justify-center`}>
        <KeyRound size={28} className={t.textFaint} />
      </div>
      <div>
        <h3 className={`${t.textSecondary} font-semibold text-base mb-1`}>No credentials yet</h3>
        <p className={`${t.textMuted} text-sm leading-relaxed max-w-xs`}>
          Save your API keys, database passwords, and tokens here.
          They're encrypted before storage — nodes can reference them by name.
        </p>
      </div>
      <button
        onClick={onNew}
        className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
      >
        <Plus size={15} /> Add First Credential
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Credentials() {
  const navigate = useNavigate()

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('flowDarkMode')
    return saved === null ? true : saved === 'true'
  })
  const toggleDark = () => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem('flowDarkMode', String(next))
      return next
    })
  }
  const t = dark ? T.dark : T.light

  const [activeNav, setActiveNav] = useState('credentials')
  const [creds,    setCreds]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    navigate('/login')
  }

  const userName = localStorage.getItem('userName') || ''

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
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
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

  const showForm = creating || !!selected

  return (
    <DashboardLayout
      activeId={activeNav}
      onSelect={setActiveNav}
      userName={userName}
      onLogout={logout}
      breadcrumb="Credentials Vault"
      dark={dark}
      onToggleDark={toggleDark}
    >
      <div className={`flex h-full ${t.bg} transition-colors duration-200 overflow-hidden`}>

        {/* ── Left: credential list ── */}
        <aside className={`w-72 border-r ${t.border} flex flex-col ${t.bgPanel} shrink-0 h-full`}>
          {/* Header */}
          <div className={`px-4 py-3.5 border-b ${t.border} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2">
              <KeyRound size={13} className={t.textFaint} />
              <span className={`${t.textFaint} text-[11px] font-bold uppercase tracking-widest`}>
                Saved Credentials
              </span>
              {!loading && (
                <span className={`text-[10px] font-mono ${t.textFaint} ${t.bgInput} px-1.5 py-0.5 rounded-md border ${t.border}`}>
                  {creds.length}
                </span>
              )}
            </div>
            <button
              onClick={() => { setCreating(true); setSelected(null) }}
              className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center transition-colors shadow-sm"
              title="New credential"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loading && (
              <div className="flex items-center justify-center h-20 gap-2">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className={`${t.textFaint} text-sm`}>Loading…</span>
              </div>
            )}
            {!loading && creds.length === 0 && !creating && (
              <EmptyPane onNew={() => setCreating(true)} t={t} />
            )}
            {creds.map(c => (
              <CredentialItem
                key={c.id}
                cred={c}
                selected={selected?.id === c.id}
                onClick={() => { setSelected(c); setCreating(false) }}
                onDelete={setToDelete}
                t={t}
                dark={dark}
              />
            ))}
          </div>

          {/* Footer encryption badge */}
          <div className={`px-4 py-3 border-t ${t.border} flex items-center gap-2 shrink-0`}>
            <ShieldCheck size={12} className="text-orange-400 shrink-0" />
            <span className={`${t.textFaint} text-[10px]`}>AES-256-GCM encrypted at rest</span>
          </div>
        </aside>

        {/* ── Right: form or placeholder ── */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {showForm ? (
            <CredentialForm
              initial={creating ? null : selected}
              onSave={handleSave}
              onCancel={() => { setCreating(false); setSelected(null) }}
              t={t}
              dark={dark}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-10">
              <div className={`w-16 h-16 rounded-2xl ${t.bgInput} border ${t.border} flex items-center justify-center`}>
                <KeyRound size={28} className={t.textFaint} />
              </div>
              <div>
                <p className={`${t.textSecondary} font-medium text-sm mb-1`}>Select a credential to edit</p>
                <p className={`${t.textFaint} text-xs`}>or create a new one with the + button</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete confirmation */}
      {toDelete && (
        <DeleteModal
          cred={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          t={t}
        />
      )}
    </DashboardLayout>
  )
}
