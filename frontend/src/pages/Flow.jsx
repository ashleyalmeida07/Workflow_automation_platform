/*
  Flow.jsx – visual workflow editor

  Architecture (simple, explicit):
  ─────────────────────────────────
  Flow (root)
    ├─ holds: nodes, edges, nodeTypes, selectedNode, running, execResult
    ├─ Topbar        – save / run buttons
    ├─ Sidebar       – draggable node cards loaded from /node-types
    ├─ FlowCanvas    – React-Flow canvas; receives nodes/edges as props,
    │                  calls setNodes/setEdges on changes
    ├─ NodeConfigPanel – config panel for selected node (right side)
    └─ ExecutionResultPanel – floating result overlay after a run
*/

import { useCallback, useRef, useEffect, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

import WorkflowNode         from '../components/WorkflowNode'
import NodeConfigPanel      from '../components/NodeConfigPanel'
import ExecutionResultPanel from '../components/ExecutionResultPanel'
import ExecutionsTab        from '../components/ExecutionsTab'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

// Thin fetch wrapper: if any request returns 401, clear stale token → /login
async function apiFetch(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } })
  if (res.status === 401) {
    localStorage.removeItem('token')
    toast.error('Session expired — please log in again')
    setTimeout(() => { window.location.href = '/login' }, 1500)
    throw new Error('Unauthorized')
  }
  return res
}


// ── SVG icon components per node type ────────────────────────────────────
const NODE_ICONS = {
  // ── Triggers ──────────────────────────────
  trigger: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  ),
  // Webhook: two arrows looping (incoming HTTP)
  webhook_trigger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M18 16.98h-5.99c-1.66 0-2.99-1.34-2.99-3s1.34-3 2.99-3H20"/>
      <polyline points="15 14 18 11 15 8"/>
      <path d="M6 7.02h6c1.66 0 3 1.34 3 3s-1.34 3-3 3H4"/>
      <polyline points="9 9 6 12 9 15"/>
    </svg>
  ),
  // Cron: calendar with a clock hand
  cron_scheduler: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <circle cx="16" cy="16" r="4"/>
      <polyline points="16 14 16 16 17.5 17"/>
    </svg>
  ),
  // ── Actions ───────────────────────────────
  http_request: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  // Email: envelope
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  // Slack: speech bubble
  slack: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="15" y2="10"/>
    </svg>
  ),
  action: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  // ── Logic ─────────────────────────────────
  condition: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M6 3v12"/>
      <circle cx="18" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M18 9a9 9 0 0 1-9 9"/>
    </svg>
  ),
  python_function: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  delay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  // ── Utilities ─────────────────────────────
  logger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  local_storage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  end: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  postgres_db: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  openai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  ),
  file_upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  parallel_execution: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
}

// Color accent styles per node color
const ICON_COLORS = {
  orange: { box: 'bg-orange-500/20 text-orange-400', name: 'text-orange-300', card: 'border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5' },
  blue:   { box: 'bg-blue-500/20   text-blue-400',   name: 'text-blue-300',   card: 'border-blue-500/20   hover:border-blue-500/40   hover:bg-blue-500/5'   },
  yellow: { box: 'bg-yellow-500/20 text-yellow-400', name: 'text-yellow-300', card: 'border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/5' },
  green:  { box: 'bg-green-500/20  text-green-400',  name: 'text-green-300',  card: 'border-green-500/20  hover:border-green-500/40  hover:bg-green-500/5'  },
  purple: { box: 'bg-purple-500/20 text-purple-400', name: 'text-purple-300', card: 'border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5' },
  gray:   { box: 'bg-gray-500/20   text-gray-400',   name: 'text-gray-300',   card: 'border-gray-500/20   hover:border-gray-500/40   hover:bg-gray-500/5'   },
  indigo: { box: 'bg-indigo-500/20 text-indigo-400', name: 'text-indigo-300', card: 'border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/5' },
  teal:   { box: 'bg-teal-500/20   text-teal-400',   name: 'text-teal-300',   card: 'border-teal-500/20   hover:border-teal-500/40   hover:bg-teal-500/5'   },
}

// ── Category definitions for the sidebar ─────────────────────────────────
// accent color shown on the section header
const CATEGORY_META = {
  Triggers:  { color: 'text-orange-400', dot: 'bg-orange-500' },
  Actions:   { color: 'text-blue-400',   dot: 'bg-blue-500'   },
  Logic:     { color: 'text-yellow-400', dot: 'bg-yellow-500' },
  Utilities: { color: 'text-teal-400',   dot: 'bg-teal-500'   },
}
const CATEGORY_ORDER = ['Triggers', 'Actions', 'Logic', 'Utilities']

// Stable map given to ReactFlow (must live outside component to avoid re-render loops)
const RF_NODE_TYPES = { workflowNode: WorkflowNode }

let _nodeId = 0
const newId  = () => `n_${Date.now()}_${_nodeId++}`

// ─────────────────────────────────────────────
// Sidebar – grouped by category, searchable
// ─────────────────────────────────────────────
function Sidebar({ nodeTypes }) {
  const [search, setSearch]     = useState('')
  // All categories open by default
  const [openCats, setOpenCats] = useState(() =>
    Object.fromEntries(CATEGORY_ORDER.map(c => [c, true]))
  )

  const onDragStart = (e, engineType, def) => {
    e.dataTransfer.setData('flow/engineType', engineType)
    e.dataTransfer.setData('flow/label',      def.name)
    e.dataTransfer.setData('flow/color',      def.color || 'blue')
    e.dataTransfer.effectAllowed = 'move'
  }

  const toggleCat = (cat) => setOpenCats(prev => ({ ...prev, [cat]: !prev[cat] }))

  // Filter nodes and group by category
  const q = search.toLowerCase().trim()
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const nodes = Object.entries(nodeTypes).filter(([key, def]) => {
      const inCat   = (def.category || 'Utilities') === cat
      const matchQ  = !q ||
        def.name.toLowerCase().includes(q) ||
        (def.description || '').toLowerCase().includes(q) ||
        key.toLowerCase().includes(q)
      return inCat && matchQ
    })
    if (nodes.length > 0) acc[cat] = nodes
    return acc
  }, {})

  const totalCount = Object.values(nodeTypes).length

  return (
    <aside className="w-64 bg-[#0e0e0e] border-r border-white/[0.06] flex flex-col h-full shrink-0">

      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="w-3.5 h-3.5 text-white/40 shrink-0">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest flex-1">Nodes</span>
          <span className="text-white/25 text-[10px] font-mono">{totalCount}</span>
        </div>

        {/* Search input */}
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="w-3.5 h-3.5 text-white/25 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full bg-white/[0.04] border border-white/[0.07] text-white/80 text-[11px]
              rounded-lg pl-8 pr-7 py-1.5 outline-none focus:border-white/20 placeholder:text-white/20
              transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-sm">
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Category groups ── */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {Object.keys(grouped).length === 0 && (
          <p className="text-white/20 text-xs px-4 py-3 italic">No nodes match "{search}"</p>
        )}

        {CATEGORY_ORDER.filter(cat => grouped[cat]).map(cat => {
          const meta    = CATEGORY_META[cat] || { color: 'text-white/50', dot: 'bg-white/30' }
          const isOpen  = openCats[cat]
          const entries = grouped[cat]
          return (
            <div key={cat} className="mb-1">
              {/* Section header — click to collapse/expand */}
              <button
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-white/[0.03] transition-colors"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest flex-1 text-left ${meta.color}`}>
                  {cat}
                </span>
                <span className="text-white/20 text-[10px] font-mono mr-1">{entries.length}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={`w-3 h-3 text-white/25 transition-transform ${isOpen ? '' : '-rotate-90'}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Node cards */}
              {isOpen && (
                <div className="px-3 pb-1 flex flex-col gap-1.5 mt-0.5">
                  {entries.map(([key, def]) => {
                    const c    = ICON_COLORS[def.color] || ICON_COLORS.blue
                    const icon = NODE_ICONS[key]
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={e => onDragStart(e, key, def)}
                        className={`
                          flex items-center gap-2.5 p-2.5 rounded-xl border bg-white/[0.02]
                          cursor-grab active:cursor-grabbing transition-all duration-150 select-none
                          ${c.card}
                        `}
                        title={def.description}
                      >
                        {/* Icon box */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.box}`}>
                          {icon}
                        </div>
                        {/* Label + description */}
                        <div className="min-w-0 flex-1">
                          <div className={`text-[12px] font-semibold leading-tight ${c.name}`}>
                            {def.name}
                          </div>
                          <div className="text-[10px] text-white/30 leading-snug mt-0.5 line-clamp-1">
                            {def.description}
                          </div>
                        </div>
                        {/* Grip dots hint */}
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-white/10 shrink-0">
                          <circle cx="9"  cy="7"  r="1.2"/>
                          <circle cx="9"  cy="12" r="1.2"/>
                          <circle cx="9"  cy="17" r="1.2"/>
                          <circle cx="15" cy="7"  r="1.2"/>
                          <circle cx="15" cy="12" r="1.2"/>
                          <circle cx="15" cy="17" r="1.2"/>
                        </svg>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Drag hint */}
        <div className="mx-3 mt-2 p-2.5 bg-white/[0.02] rounded-xl border border-white/[0.05]">
          <p className="text-white/20 text-[10px] leading-relaxed">
            Drag any node onto the canvas to add it.
          </p>
        </div>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────
// Topbar
// ─────────────────────────────────────────────
function Topbar({ workflowId, running, onRun, getFlowState, onLoad }) {
  const [saving, setSaving] = useState(false)
  const loadRef = useRef(null)

  const handleSave = async () => {
    if (!workflowId) return
    setSaving(true)
    try {
      const { nodes, edges } = getFlowState()
      const res = await apiFetch(`${API}/workflows/${workflowId}`, {
        method: 'PUT',
        body: JSON.stringify({ workflow_json: { nodes, edges } }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      toast.success('Workflow saved')
    } catch (err) {
      toast.error(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    const { nodes, edges } = getFlowState()
    const json = JSON.stringify({ nodes, edges }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `workflow-${workflowId || 'draft'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoad = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      if (!json.nodes && !json.edges) {
        alert('Invalid workflow JSON: missing nodes/edges')
        return
      }
      onLoad(json.nodes || [], json.edges || [])
    } catch (err) {
      toast.error(`Failed to load JSON: ${err.message}`)
    } finally {
      if (loadRef.current) loadRef.current.value = ''
    }
  }

  return (
    <div className="h-14 border-b border-white/[0.06] flex items-center px-4 shrink-0
      bg-[#0a0a0a] justify-between z-10 relative">

      <Link to="/dashboard"
        className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/80 rounded-lg
          hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <span className="text-white font-semibold text-sm">Flow Editor</span>

      <div className="flex items-center gap-2">
        {/* Load JSON */}
        <input ref={loadRef} type="file" accept=".json" onChange={handleLoad} className="hidden" />
        <button onClick={() => loadRef.current?.click()}
          title="Load workflow from JSON"
          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 text-sm
            font-medium rounded-lg hover:bg-white/10 hover:text-white/90 transition-colors
            flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Load
        </button>

        {/* Download JSON */}
        <button onClick={handleDownload} disabled={!workflowId}
          title="Download workflow JSON"
          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 text-sm
            font-medium rounded-lg hover:bg-white/10 hover:text-white/90 transition-colors
            disabled:opacity-40 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          JSON
        </button>

        <button onClick={handleSave} disabled={saving || !workflowId}
          className="px-4 py-1.5 bg-white/5 border border-white/10 text-white/80 text-sm
            font-medium rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40">
          {saving ? 'Saving…' : 'Save'}
        </button>

        <button onClick={onRun} disabled={running || !workflowId}
          className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-lg
            hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20
            disabled:opacity-50 flex items-center gap-1.5">
          {running
            ? <><span className="inline-block animate-spin">⟳</span> Running…</>
            : <>▶ Run</>}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// FlowCanvas  (inner — needs useReactFlow hook)
// ─────────────────────────────────────────────
function FlowCanvasInner({
  workflowId,
  nodeTypes,
  nodes, setNodes,
  edges, setEdges,
  onNodesChange, onEdgesChange,
  onNodeSelect,
}) {
  const { screenToFlowPosition } = useReactFlow()
  const wrapperRef = useRef(null)
  const [ctxMenu, setCtxMenu] = useState(null)

  // Load saved workflow on mount
  useEffect(() => {
    if (!workflowId) return
    apiFetch(`${API}/workflows/${workflowId}`)
      .then(r => r.json())
      .then(data => {
        if (data.workflow_json) {
          setNodes(data.workflow_json.nodes || [])
          setEdges(data.workflow_json.edges || [])
        }
      })
      .catch(err => { if (err.message !== 'Unauthorized') console.error(err) })
  }, [workflowId])

  // ── Drag & Drop ──────────────────────────────────────────────────────
  const onDragOver = useCallback(e => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(e => {
    e.preventDefault()

    const engineType = e.dataTransfer.getData('flow/engineType')
    const label      = e.dataTransfer.getData('flow/label')
    const color      = e.dataTransfer.getData('flow/color')

    if (!engineType) return   // not one of our drags

    // Convert screen coordinates to ReactFlow canvas coordinates
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })

    // Seed default settings values from the type definition
    const typeDef = nodeTypes[engineType] || {}
    const defaultSettings = {}
    for (const [k, def] of Object.entries(typeDef.settings || {})) {
      defaultSettings[k] = def.default ?? ''
    }

    const newNode = {
      id:   newId(),
      type: 'workflowNode',          // maps to our WorkflowNode component
      position,
      data: {
        label,
        engine_type: engineType,
        color,
        settings: defaultSettings,
      },
    }

    setNodes(nds => [...nds, newNode])
  }, [screenToFlowPosition, setNodes, nodeTypes])

  // ── Edges ────────────────────────────────────────────────────────────
  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: 'rgba(255,255,255,0.35)',
      strokeWidth: 1.5,
    },
    markerEnd: {
      type: 'arrowclosed',
      color: 'rgba(255,255,255,0.35)',
      width: 14,
      height: 14,
    },
  }

  const onConnect = useCallback(
    params => setEdges(eds => {
      // Cycle detection (DFS) to prevent infinite loops
      const hasCycle = (source, target, edges) => {
        if (source === target) return true
        const visited = new Set()
        const stack = [target]
        while (stack.length > 0) {
          const current = stack.pop()
          if (current === source) return true
          if (!visited.has(current)) {
            visited.add(current)
            const children = edges.filter(e => e.source === current).map(e => e.target)
            stack.push(...children)
          }
        }
        return false
      }

      if (hasCycle(params.source, params.target, eds)) {
        toast.error('Invalid connection: Creates an infinite loop.')
        return eds
      }
      // Block connections INTO trigger nodes — they are always start nodes
      const targetNode = nodes.find(n => n.id === params.target)
      if (targetNode?.data?.engine_type === 'trigger') {
        toast.error('Cannot connect into a Start/Trigger node.')
        return eds
      }

      return addEdge({ ...params, ...defaultEdgeOptions }, eds)
    }),
    [setEdges],
  )

  // ── Selection ────────────────────────────────────────────────────────
  const onNodeClick   = useCallback((_, node) => onNodeSelect(node), [onNodeSelect])
  const onPaneClick   = useCallback(() => { onNodeSelect(null); setCtxMenu(null) }, [onNodeSelect])

  // ── Context menu (right-click node or edge to delete) ───────────────
  const onNodeContextMenu = useCallback((e, node) => {
    e.preventDefault()
    setCtxMenu({ kind: 'node', id: node.id, x: e.clientX, y: e.clientY })
  }, [])

  const onEdgeContextMenu = useCallback((e, edge) => {
    e.preventDefault()
    setCtxMenu({ kind: 'edge', id: edge.id, x: e.clientX, y: e.clientY })
  }, [])

  const deleteNode = useCallback(id => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    onNodeSelect(null)
    setCtxMenu(null)
  }, [setNodes, setEdges, onNodeSelect])

  const deleteEdge = useCallback(id => {
    setEdges(eds => eds.filter(e => e.id !== id))
    setCtxMenu(null)
  }, [setEdges])

  return (
    <div ref={wrapperRef} className="flex-1 h-full relative">
      <ReactFlow
        nodeTypes={RF_NODE_TYPES}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1.5, strokeDasharray: '5 4' }}
        fitView
        colorMode="dark"
        className="bg-[#0c0c0c]"
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
        snapGrid={[16, 16]}
      >
        <Controls
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
        />
        <MiniMap
          zoomable
          pannable
          nodeBorderRadius={8}
          maskStrokeColor="rgba(255,255,255,0.1)"
          maskStrokeWidth={2}
          maskColor="rgba(0, 0, 0, 0.6)"
          className="!bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 !rounded-2xl shadow-2xl overflow-hidden"
          nodeColor={n => {
            const c = n.data?.color
            // Lighter, more pastel colors for the minimap nodes look more premium on dark mode
            const map = { orange:'#fb923c', purple:'#c084fc', green:'#4ade80', yellow:'#facc15', teal:'#2dd4bf', indigo:'#818cf8', gray:'#9ca3af' }
            return map[c] || '#60a5fa'
          }}
        />
        <Background variant="lines" gap={32} size={0.5} color="#ffffff08" />
      </ReactFlow>

      {/* Right-click context menu (node or edge) */}
      {ctxMenu && (
        <div
          style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 999 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl py-1 min-w-[150px]"
          onMouseLeave={() => setCtxMenu(null)}
        >
          {ctxMenu.kind === 'node' && (
            <button
              onClick={() => deleteNode(ctxMenu.id)}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
            >
              <span>🗑</span> Delete node
            </button>
          )}
          {ctxMenu.kind === 'edge' && (
            <button
              onClick={() => deleteEdge(ctxMenu.id)}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
            >
              <span>✂</span> Remove connection
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────
export default function Flow() {
  const location   = useLocation()
  const workflowId = location.state?.workflowId

  // ── Shared state (lifted here so Topbar + ConfigPanel can both access) ─
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const [nodeTypes,    setNodeTypes]    = useState({})
  const [selectedNode, setSelectedNode] = useState(null)
  const [running,      setRunning]      = useState(false)
  const [execResult,   setExecResult]   = useState(null)

  // ── Load node-types catalogue (no auth needed) ─────────────────────────
  useEffect(() => {
    fetch(`${API}/node-types/`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load node types')
        return r.json()
      })
      .then(setNodeTypes)
      .catch(err => console.error('node-types fetch failed:', err))
  }, [])

  // ── Config panel: update a node's settings and/or label ────────────────
  const handleSettingsUpdate = useCallback((nodeId, newSettings, newLabel) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n
      const updatedData = { ...n.data, settings: newSettings }
      if (newLabel !== undefined) updatedData.label = newLabel
      return { ...n, data: updatedData }
    }))
    // Keep the panel in sync too
    setSelectedNode(prev => {
      if (prev?.id !== nodeId) return prev
      const updatedData = { ...prev.data, settings: newSettings }
      if (newLabel !== undefined) updatedData.label = newLabel
      return { ...prev, data: updatedData }
    })
  }, [setNodes])

  // ── Animate steps after execution ─────────────────────────────────────
  const animateSteps = useCallback(async (steps) => {
    const STEP_MS    = 500   // how long each node shows "running"
    const CLEAR_MS   = 4000  // how long success/failed badges linger

    // Helper: set _status on one node
    const setStatus = (nodeId, status) =>
      setNodes(nds => nds.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, _status: status } } : n
      ))

    // Helper: clear all _status fields
    const clearAll = () =>
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, _status: undefined } })))

    for (const step of steps) {
      setStatus(step.node_id, 'running')
      await new Promise(r => setTimeout(r, STEP_MS))
      setStatus(step.node_id, step.error ? 'failed' : 'success')
    }

    // Auto-clear after a pause so the user can see the final state
    await new Promise(r => setTimeout(r, CLEAR_MS))
    clearAll()
  }, [setNodes])

  // ── Run the workflow ───────────────────────────────────────────────────
  const handleRun = async () => {
    if (!workflowId) return

    // Pre-flight check for missing configuration
    const { nodes } = getFlowState()
    for (const n of nodes) {
      if (n.data.engine_type === 'http_request' && !n.data.settings?.url) {
        toast.error(`Missing configuration: Node "${n.data.label}" requires a URL.`)
        return
      }
    }

    setRunning(true)
    setExecResult(null)
    try {
      const res  = await apiFetch(`${API}/workflows/${workflowId}/execute`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok || data.status === 'failed') {
        toast.error(data.error || data.detail || 'Execution failed')
      }
      setExecResult(data)

      // Replay step animations (non-blocking — let it run in the background)
      if (data.steps?.length) {
        animateSteps(data.steps)
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`)
      setExecResult({ status: 'failed', steps: [], error: err.message })
    } finally {
      setRunning(false)
    }
  }

  // Topbar needs to read current nodes/edges without a closure stale-state issue
  const getFlowState = useCallback(() => ({ nodes, edges }), [nodes, edges])

  // Load JSON into canvas
  const handleLoadJSON = useCallback((newNodes, newEdges) => {
    setNodes(newNodes)
    setEdges(newEdges)
  }, [setNodes, setEdges])

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a]">
      <ReactFlowProvider>
        <Topbar
          workflowId={workflowId}
          running={running}
          onRun={handleRun}
          getFlowState={getFlowState}
          onLoad={handleLoadJSON}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <Sidebar nodeTypes={nodeTypes} />

            <FlowCanvasInner
              workflowId={workflowId}
              nodeTypes={nodeTypes}
              nodes={nodes}         setNodes={setNodes}
              edges={edges}         setEdges={setEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeSelect={setSelectedNode}
            />

            {/* Config panel – only shown when a node is selected */}
            {selectedNode && (
              <NodeConfigPanel
                node={selectedNode}
                nodeTypes={nodeTypes}
                onUpdate={handleSettingsUpdate}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>

          {/* Executions history tab at the bottom */}
          <ExecutionsTab workflowId={workflowId} lastResult={execResult} />
        </div>

        {/* Execution result overlay */}
        {execResult && (
          <ExecutionResultPanel
            result={execResult}
            onClose={() => setExecResult(null)}
          />
        )}
      </ReactFlowProvider>
    </div>
  )
}
