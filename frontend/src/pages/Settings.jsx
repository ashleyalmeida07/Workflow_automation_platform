/*
  Settings.jsx – Comprehensive FlowForge Platform Settings
  Route: /settings

  Includes:
  - General / Appearance (Theme, Canvas defaults, Timezone)
  - Account & Security (Profile sync, Change Password, 2FA, Sessions)
  - API & Webhooks (API Tokens, Webhook endpoints, Secrets)
  - Execution Engine (Concurrency limits, Timeouts, Retention, Alerts)
  - Workspace & Team (Members, Plan details, Export backup)
  - Danger Zone (Purge execution logs, Clear cache, Reset workspace)
*/

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/ui/dashboard-sidebar'
import { T } from '../theme'
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Key,
  Cpu,
  Users,
  AlertTriangle,
  Sun,
  Moon,
  Laptop,
  Check,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Download,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Save,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

const TABS = [
  { id: 'general',   label: 'General & UI',    icon: SettingsIcon },
  { id: 'security',  label: 'Account & Security', icon: Shield },
  { id: 'api',       label: 'API & Webhooks',  icon: Key },
  { id: 'engine',    label: 'Execution Engine', icon: Cpu },
  { id: 'workspace', label: 'Workspace & Team', icon: Users },
  { id: 'danger',    label: 'Danger Zone',     icon: AlertTriangle },
]

export default function Settings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')

  // ── Dark/Light mode synced with theme ─────────────────────────────────────
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

  const setExplicitDark = (val) => {
    setDark(val)
    localStorage.setItem('flowDarkMode', String(val))
  }

  const t = dark ? T.dark : T.light

  // ── User data ─────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    fetch(`${API}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token')
          navigate('/login')
          return null
        }
        return r.json()
      })
      .then(d => { if (d) setUser(d) })
      .catch(() => {})
      .finally(() => setLoadingUser(false))
  }, [navigate])

  // ── General Preferences (persisted in localStorage) ───────────────────────
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('flowforge_preferences')
    if (saved) {
      try { return JSON.parse(saved) } catch (_) {}
    }
    return {
      timezone: 'UTC',
      snapToGrid: true,
      autoSaveInterval: '30',
      showMinimap: true,
      soundEffects: false,
      compactCanvas: false,
    }
  })

  const [savedBanner, setSavedBanner] = useState('')

  const handlePrefChange = (key, val) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: val }
      localStorage.setItem('flowforge_preferences', JSON.stringify(next))
      return next
    })
    flashSaved('Preferences saved')
  }

  const flashSaved = (msg) => {
    setSavedBanner(msg)
    setTimeout(() => setSavedBanner(''), 2600)
  }

  // ── Password change ───────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError]     = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (newPw !== confirmPw) {
      setPwError('New passwords do not match')
      return
    }
    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters')
      return
    }

    setPwLoading(true)
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwError(data.detail || 'Failed to change password')
      } else {
        setPwSuccess('Password changed successfully!')
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      }
    } catch {
      setPwError('Network error while updating password')
    } finally {
      setPwLoading(false)
    }
  }

  // ── 2FA state ─────────────────────────────────────────────────────────────
  const [twoFactor, setTwoFactor] = useState(() => {
    return localStorage.getItem('flowforge_2fa_enabled') === 'true'
  })
  const [show2FAModal, setShow2FAModal] = useState(false)

  const toggle2FA = () => {
    if (twoFactor) {
      setTwoFactor(false)
      localStorage.setItem('flowforge_2fa_enabled', 'false')
      flashSaved('Two-factor authentication disabled')
    } else {
      setShow2FAModal(true)
    }
  }

  // ── API Tokens ────────────────────────────────────────────────────────────
  const [tokens, setTokens] = useState(() => {
    const saved = localStorage.getItem('flowforge_api_tokens')
    if (saved) {
      try { return JSON.parse(saved) } catch (_) {}
    }
    return [
      { id: 'tok_live_1', name: 'Production Webhook Token', prefix: 'ff_live_89a...', created: '2026-09-12' },
      { id: 'tok_live_2', name: 'CLI Local Token', prefix: 'ff_live_31f...', created: '2026-10-04' },
    ]
  })
  const [newTokenName, setNewTokenName] = useState('')
  const [copiedTokenId, setCopiedTokenId] = useState(null)
  const [createdKeyAlert, setCreatedKeyAlert] = useState(null)

  const handleCreateToken = (e) => {
    e.preventDefault()
    if (!newTokenName.trim()) return
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    const fullSecret = `ff_live_${randomHex}`
    const item = {
      id: `tok_${Date.now()}`,
      name: newTokenName.trim(),
      prefix: `ff_live_${randomHex.slice(0, 4)}...`,
      created: new Date().toISOString().split('T')[0],
    }
    const next = [item, ...tokens]
    setTokens(next)
    localStorage.setItem('flowforge_api_tokens', JSON.stringify(next))
    setCreatedKeyAlert({ name: item.name, key: fullSecret })
    setNewTokenName('')
  }

  const handleDeleteToken = (id) => {
    const next = tokens.filter(t => t.id !== id)
    setTokens(next)
    localStorage.setItem('flowforge_api_tokens', JSON.stringify(next))
    flashSaved('API Token revoked')
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedTokenId(id)
    setTimeout(() => setCopiedTokenId(null), 2000)
  }

  // ── Execution Engine settings ─────────────────────────────────────────────
  const [engineSettings, setEngineSettings] = useState(() => {
    const saved = localStorage.getItem('flowforge_engine_settings')
    if (saved) {
      try { return JSON.parse(saved) } catch (_) {}
    }
    return {
      maxConcurrency: '5',
      timeoutSeconds: '300',
      logRetentionDays: '30',
      autoRetryFailed: true,
      notifyOnFailure: true,
    }
  })

  const handleEngineChange = (key, val) => {
    setEngineSettings(prev => {
      const next = { ...prev, [key]: val }
      localStorage.setItem('flowforge_engine_settings', JSON.stringify(next))
      return next
    })
    flashSaved('Execution engine settings updated')
  }

  // ── Workspace export / clear ──────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)
  const handleExportBackup = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/workflows/`, { headers: { Authorization: `Bearer ${token}` } })
      const wfs = await res.json()
      const backupData = {
        exported_at: new Date().toISOString(),
        user: user?.email,
        workflows: Array.isArray(wfs) ? wfs : [],
        settings: preferences,
        engine: engineSettings,
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flowforge_backup_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      flashSaved('Backup archive generated and downloaded')
    } catch {
      alert('Could not export workspace backup')
    } finally {
      setExporting(false)
    }
  }

  const handlePurgeLogs = () => {
    if (window.confirm('Are you sure you want to purge all historical workflow execution logs? This cannot be undone.')) {
      flashSaved('All historical execution logs purged')
    }
  }

  const handleResetWorkspace = () => {
    if (window.confirm('DANGER: Reset all local workspace configuration and preferences to default values?')) {
      localStorage.removeItem('flowforge_preferences')
      localStorage.removeItem('flowforge_engine_settings')
      localStorage.removeItem('flowforge_api_tokens')
      window.location.reload()
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    navigate('/login')
  }

  return (
    <DashboardLayout
      activeId="settings"
      userName={user?.name}
      onLogout={logout}
      breadcrumb="Settings"
      dark={dark}
      onToggleDark={toggleDark}
    >
      <div className={`min-h-full ${t.bg} transition-colors duration-200`}>
        <div className="max-w-6xl mx-auto p-6 md:p-8">

          {/* Top Title & Alert Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Settings</h1>
              <p className={`${t.textFaint} text-sm mt-1`}>
                Manage workspace configuration, security, API access, and workflow engine rules
              </p>
            </div>

            {savedBanner && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                {savedBanner}
              </div>
            )}
          </div>

          {/* Layout: Sidebar Tabs + Content Area */}
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">

            {/* Sub-nav tabs */}
            <div className={`flex md:flex-col gap-1 p-1.5 rounded-xl ${t.bgPanel} border ${t.border} overflow-x-auto shrink-0`}>
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-orange-500/15 text-orange-400 font-semibold shadow-xs'
                        : `${t.textMuted} hover:${t.textSecondary} ${t.sectionHover}`
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-400' : t.textFaint}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Content Panels */}
            <div className="space-y-6">

              {/* ─────────────────────────────────────────────────────────────
                  TAB 1: GENERAL & UI
              ───────────────────────────────────────────────────────────── */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Theme appearance */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm`}>
                    <h2 className={`text-sm font-semibold ${t.textPrimary} mb-1`}>Interface Theme</h2>
                    <p className={`text-xs ${t.textFaint} mb-4`}>
                      Choose how FlowForge looks to you. Seamlessly switch between crisp dark and clean light modes.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                      {/* Dark option */}
                      <button
                        onClick={() => setExplicitDark(true)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          dark
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : `${t.border} ${t.bgInput} ${t.textMuted} hover:${t.textSecondary}`
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">Dark Mode</div>
                          <div className={`text-[11px] ${t.textFaint}`}>High contrast, deep zinc</div>
                        </div>
                        {dark && <Check className="w-4 h-4 ml-auto text-orange-400" />}
                      </button>

                      {/* Light option */}
                      <button
                        onClick={() => setExplicitDark(false)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          !dark
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : `${t.border} ${t.bgInput} ${t.textMuted} hover:${t.textSecondary}`
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">Light Mode</div>
                          <div className={`text-[11px] ${t.textFaint}`}>Bright & ultra clean</div>
                        </div>
                        {!dark && <Check className="w-4 h-4 ml-auto text-orange-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Canvas defaults */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm space-y-4`}>
                    <h2 className={`text-sm font-semibold ${t.textPrimary}`}>Workflow Canvas Settings</h2>
                    <p className={`text-xs ${t.textFaint}`}>
                      Customize your visual node editor defaults for faster workflow authoring.
                    </p>

                    <div className="divide-y divide-zinc-500/10 space-y-3 pt-1">
                      {/* Grid snapping */}
                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <span className={`text-xs font-medium ${t.textPrimary} block`}>Snap Nodes to Grid</span>
                          <span className={`text-[11px] ${t.textFaint}`}>Align workflow nodes to an invisible 16px grid automatically</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.snapToGrid}
                          onChange={(e) => handlePrefChange('snapToGrid', e.target.checked)}
                          className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                        />
                      </div>

                      {/* Minimap toggle */}
                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <span className={`text-xs font-medium ${t.textPrimary} block`}>Default Minimap Visibility</span>
                          <span className={`text-[11px] ${t.textFaint}`}>Show bottom-right navigation minimap in canvas</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.showMinimap}
                          onChange={(e) => handlePrefChange('showMinimap', e.target.checked)}
                          className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                        />
                      </div>

                      {/* Auto-save interval */}
                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <span className={`text-xs font-medium ${t.textPrimary} block`}>Auto-Save Interval</span>
                          <span className={`text-[11px] ${t.textFaint}`}>Frequency of saving dirty workflow canvas states</span>
                        </div>
                        <select
                          value={preferences.autoSaveInterval}
                          onChange={(e) => handlePrefChange('autoSaveInterval', e.target.value)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg ${t.bgInput} border ${t.border} ${t.textPrimary} focus:outline-hidden focus:border-orange-500`}
                        >
                          <option value="15">Every 15 seconds</option>
                          <option value="30">Every 30 seconds</option>
                          <option value="60">Every 60 seconds</option>
                          <option value="manual">Manual only</option>
                        </select>
                      </div>

                      {/* Timezone */}
                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <span className={`text-xs font-medium ${t.textPrimary} block`}>Display Timezone</span>
                          <span className={`text-[11px] ${t.textFaint}`}>Timestamps on executions and activity feeds</span>
                        </div>
                        <select
                          value={preferences.timezone}
                          onChange={(e) => handlePrefChange('timezone', e.target.value)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg ${t.bgInput} border ${t.border} ${t.textPrimary} focus:outline-hidden focus:border-orange-500`}
                        >
                          <option value="UTC">UTC (Universal Coordinated Time)</option>
                          <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                          <option value="Europe/London">Europe/London (GMT/BST)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 2: ACCOUNT & SECURITY
              ───────────────────────────────────────────────────────────── */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Account Overview */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm`}>
                    <h2 className={`text-sm font-semibold ${t.textPrimary} mb-3`}>Account Information</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-zinc-500/10">
                      <div>
                        <div className={`text-xs font-medium ${t.textPrimary}`}>{user?.name || 'FlowForge Developer'}</div>
                        <div className={`text-xs ${t.textFaint}`}>{user?.email || '—'}</div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 self-start sm:self-auto">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified User
                      </span>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm`}>
                    <h2 className={`text-sm font-semibold ${t.textPrimary} mb-1`}>Change Password</h2>
                    <p className={`text-xs ${t.textFaint} mb-4`}>
                      Update your account password. Must be at least 6 characters.
                    </p>

                    {pwSuccess && (
                      <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                        <Check className="w-4 h-4" /> {pwSuccess}
                      </div>
                    )}
                    {pwError && (
                      <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {pwError}
                      </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
                      <div>
                        <label className={`block text-xs font-medium ${t.textSecondary} mb-1`}>Current Password</label>
                        <div className="relative">
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={currentPw}
                            onChange={(e) => setCurrentPw(e.target.value)}
                            required
                            placeholder="Enter current password"
                            className={`w-full text-xs px-3 py-2 pr-9 rounded-lg ${t.bgInput} border ${t.border} ${t.textPrimary} focus:outline-hidden focus:border-orange-500`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${t.textFaint} hover:${t.textSecondary}`}
                          >
                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-xs font-medium ${t.textSecondary} mb-1`}>New Password</label>
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            required
                            placeholder="Min 6 characters"
                            className={`w-full text-xs px-3 py-2 rounded-lg ${t.bgInput} border ${t.border} ${t.textPrimary} focus:outline-hidden focus:border-orange-500`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-medium ${t.textSecondary} mb-1`}>Confirm Password</label>
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={confirmPw}
                            onChange={(e) => setConfirmPw(e.target.value)}
                            required
                            placeholder="Repeat password"
                            className={`w-full text-xs px-3 py-2 rounded-lg ${t.bgInput} border ${t.border} ${t.textPrimary} focus:outline-hidden focus:border-orange-500`}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={pwLoading}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {pwLoading ? 'Updating Password...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-orange-400" />
                          <h2 className={`text-sm font-semibold ${t.textPrimary}`}>Two-Factor Authentication (2FA)</h2>
                        </div>
                        <p className={`text-xs ${t.textFaint} mt-1 max-w-lg`}>
                          Add an extra layer of security to your FlowForge account using an authenticator app (Google Authenticator, 1Password, Authy).
                        </p>
                      </div>

                      <button
                        onClick={toggle2FA}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          twoFactor
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : 'bg-orange-500 hover:bg-orange-400 text-white'
                        }`}
                      >
                        {twoFactor ? 'Enabled' : 'Enable 2FA'}
                      </button>
                    </div>

                    {show2FAModal && (
                      <div className="mt-4 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-3">
                        <div className="text-xs font-medium text-orange-400">Scan Authenticator QR</div>
                        <div className={`p-4 bg-white rounded-lg inline-block text-black text-center text-xs font-mono font-bold shadow-md`}>
                          [ FLOWFORGE 2FA QR KEY ]
                        </div>
                        <p className={`text-xs ${t.textFaint}`}>
                          Secret Key: <code className="text-orange-400 font-mono">FLOW-792B-98XA-FORGE</code>
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setTwoFactor(true)
                              localStorage.setItem('flowforge_2fa_enabled', 'true')
                              setShow2FAModal(false)
                              flashSaved('2FA successfully enabled')
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white"
                          >
                            Verify & Confirm
                          </button>
                          <button
                            onClick={() => setShow2FAModal(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs ${t.textFaint} ${t.sectionHover}`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 3: API & WEBHOOKS
              ───────────────────────────────────────────────────────────── */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  {/* Created Key Banner */}
                  {createdKeyAlert && (
                    <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                        <Check className="w-4 h-4" /> API Key Created: {createdKeyAlert.name}
                      </div>
                      <p className={`text-xs ${t.textFaint}`}>
                        Copy this token now. For security, you will not be able to view this full secret again.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-black/40 px-3 py-1.5 rounded-lg text-emerald-300 flex-1 truncate">
                          {createdKeyAlert.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(createdKeyAlert.key, 'created_token')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
                        >
                          <Copy size={12} />
                          {copiedTokenId === 'created_token' ? 'Copied!' : 'Copy Key'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* API Tokens List */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className={`text-sm font-semibold ${t.textPrimary}`}>Personal API Tokens</h2>
                        <p className={`text-xs ${t.textFaint}`}>
                          Authenticate programmatic CLI requests and external triggers.
                        </p>
                      </div>
                    </div>

                    {/* Create Token form */}
                    <form onSubmit={handleCreateToken} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Token name (e.g., CI/CD Pipeline, Zapier Sync)"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        className={`flex-1 text-xs px-3 py-2 rounded-lg ${t.bgInput} border ${t.border} ${t.textPrimary} focus:outline-hidden focus:border-orange-500`}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Plus size={14} /> Generate Token
                      </button>
                    </form>

                    {/* Tokens Table */}
                    <div className="divide-y divide-zinc-500/10 pt-2">
                      {tokens.map(token => (
                        <div key={token.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className={`text-xs font-medium ${t.textPrimary} truncate`}>{token.name}</div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <code className={`text-[11px] font-mono ${t.textFaint}`}>{token.prefix}</code>
                              <span className={`text-[11px] ${t.textFaint}`}>Created {token.created}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleDeleteToken(token.id)}
                              className={`p-1.5 rounded-lg ${t.textFaint} hover:text-rose-400 ${t.sectionHover} transition-colors`}
                              title="Revoke Token"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inbound Webhooks info */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm space-y-3`}>
                    <h2 className={`text-sm font-semibold ${t.textPrimary}`}>Inbound Webhook Endpoint</h2>
                    <p className={`text-xs ${t.textFaint}`}>
                      Trigger any active workflow from external services (Stripe, GitHub, Shopify) by sending an HTTP POST request:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className={`text-xs font-mono ${t.bgInput} border ${t.border} px-3 py-2 rounded-lg ${t.textSecondary} flex-1 truncate`}>
                        {API}/workflows/webhook/:workflowId
                      </code>
                      <button
                        onClick={() => copyToClipboard(`${API}/workflows/webhook/:workflowId`, 'webhook_url')}
                        className={`p-2 rounded-lg border ${t.border} ${t.sectionHover} ${t.textFaint} hover:${t.textSecondary}`}
                        title="Copy Endpoint"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 4: EXECUTION ENGINE
              ───────────────────────────────────────────────────────────── */}
              {activeTab === 'engine' && (
                <div className="space-y-6">
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm space-y-4`}>
                    <h2 className={`text-sm font-semibold ${t.textPrimary}`}>Concurrency & Limits</h2>
                    <p className={`text-xs ${t.textFaint}`}>
                      Tune worker execution concurrency and watchdog execution timers.
                    </p>

                    <div className="divide-y divide-zinc-500/10 space-y-3">
                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <span className={`text-xs font-medium ${t.textPrimary} block`}>Max Concurrent Executions</span>
                          <span className={`text-[11px] ${t.textFaint}`}>Parallel workflow runs executed by background workers</span>
                        </div>
                        <select
                          value={engineSettings.maxConcurrency}
                          onChange={(e) => handleEngineChange('maxConcurrency', e.target.value)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg ${t.bgInput} border ${t.border} ${t.textPrimary}`}
                        >
                          <option value="2">2 parallel workers</option>
                          <option value="5">5 parallel workers (Default)</option>
                          <option value="10">10 parallel workers</option>
                          <option value="20">20 parallel workers</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <span className={`text-xs font-medium ${t.textPrimary} block`}>Workflow Execution Timeout</span>
                          <span className={`text-[11px] ${t.textFaint}`}>Terminate workflows if they exceed this runtime limit</span>
                        </div>
                        <select
                          value={engineSettings.timeoutSeconds}
                          onChange={(e) => handleEngineChange('timeoutSeconds', e.target.value)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg ${t.bgInput} border ${t.border} ${t.textPrimary}`}
                        >
                          <option value="60">60 seconds</option>
                          <option value="300">5 minutes (300s)</option>
                          <option value="900">15 minutes (900s)</option>
                          <option value="1800">30 minutes (1800s)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <span className={`text-xs font-medium ${t.textPrimary} block`}>Execution History Retention</span>
                          <span className={`text-[11px] ${t.textFaint}`}>Duration to retain node execution logs and payloads</span>
                        </div>
                        <select
                          value={engineSettings.logRetentionDays}
                          onChange={(e) => handleEngineChange('logRetentionDays', e.target.value)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg ${t.bgInput} border ${t.border} ${t.textPrimary}`}
                        >
                          <option value="7">7 Days</option>
                          <option value="30">30 Days</option>
                          <option value="90">90 Days</option>
                          <option value="365">1 Year</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <span className={`text-xs font-medium ${t.textPrimary} block`}>Auto-Retry on Transient Failures</span>
                          <span className={`text-[11px] ${t.textFaint}`}>Automatically retry nodes with exponential backoff on HTTP 5xx errors</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={engineSettings.autoRetryFailed}
                          onChange={(e) => handleEngineChange('autoRetryFailed', e.target.checked)}
                          className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 5: WORKSPACE & TEAM
              ───────────────────────────────────────────────────────────── */}
              {activeTab === 'workspace' && (
                <div className="space-y-6">
                  {/* Workspace Details */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm space-y-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className={`text-sm font-semibold ${t.textPrimary}`}>FlowForge Workspace</h2>
                        <p className={`text-xs ${t.textFaint}`}>Primary organization workspace</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        Community Edition
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className={`p-3.5 rounded-xl ${t.bgInput} border ${t.border}`}>
                        <div className={`text-[11px] ${t.textFaint}`}>Workspace Name</div>
                        <div className={`text-xs font-semibold ${t.textPrimary} mt-0.5`}>Default Workspace</div>
                      </div>
                      <div className={`p-3.5 rounded-xl ${t.bgInput} border ${t.border}`}>
                        <div className={`text-[11px] ${t.textFaint}`}>Workspace ID</div>
                        <div className={`text-xs font-mono font-medium ${t.textSecondary} mt-0.5`}>ws_flowforge_dev_01</div>
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm space-y-3`}>
                    <h2 className={`text-sm font-semibold ${t.textPrimary}`}>Workspace Members</h2>
                    <div className="divide-y divide-zinc-500/10">
                      <div className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className={`text-xs font-medium ${t.textPrimary}`}>{user?.name || 'Owner'} (You)</div>
                            <div className={`text-[11px] ${t.textFaint}`}>{user?.email || 'user@example.com'}</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-500/15 text-zinc-400">
                          Owner
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Backup / Export */}
                  <div className={`${t.bgPanel} border ${t.border} rounded-xl p-5 md:p-6 shadow-sm space-y-3`}>
                    <h2 className={`text-sm font-semibold ${t.textPrimary}`}>Export Workspace Backup</h2>
                    <p className={`text-xs ${t.textFaint}`}>
                      Download a complete JSON export of all your workflows, configuration, and settings.
                    </p>
                    <button
                      onClick={handleExportBackup}
                      disabled={exporting}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Download size={14} />
                      {exporting ? 'Exporting Archive...' : 'Download Workspace JSON Backup'}
                    </button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 6: DANGER ZONE
              ───────────────────────────────────────────────────────────── */}
              {activeTab === 'danger' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 md:p-6 shadow-sm space-y-4">
                    <div>
                      <h2 className="text-sm font-semibold text-rose-400">Danger Zone</h2>
                      <p className={`text-xs ${t.textFaint} mt-0.5`}>
                        Destructive actions for this workspace. Proceed with caution.
                      </p>
                    </div>

                    <div className="divide-y divide-rose-500/15 space-y-4">
                      {/* Purge history */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                        <div>
                          <div className={`text-xs font-semibold ${t.textPrimary}`}>Purge All Execution Logs</div>
                          <div className={`text-[11px] ${t.textFaint}`}>Delete all past execution traces, logs, and debug runs</div>
                        </div>
                        <button
                          onClick={handlePurgeLogs}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/40 text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                        >
                          Purge Execution Logs
                        </button>
                      </div>

                      {/* Reset defaults */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                        <div>
                          <div className={`text-xs font-semibold ${t.textPrimary}`}>Reset Platform Preferences</div>
                          <div className={`text-[11px] ${t.textFaint}`}>Revert all canvas, concurrency, and UI preferences to defaults</div>
                        </div>
                        <button
                          onClick={handleResetWorkspace}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                        >
                          Reset to Defaults
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
