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

// ── SVG icon components per node type ────────────────────────────────────
const NODE_ICONS = {
  trigger: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  ),
  http_request: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  delay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  python_function: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  condition: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M6 3v12"/>
      <circle cx="18" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M18 9a9 9 0 0 1-9 9"/>
    </svg>
  ),
  logger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  action: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  end: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
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

// Stable map given to ReactFlow (must live outside component to avoid re-render loops)
const RF_NODE_TYPES = { workflowNode: WorkflowNode }

let _nodeId = 0
const newId  = () => `n_${Date.now()}_${_nodeId++}`

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
function Sidebar({ nodeTypes }) {
  const [collapsed, setCollapsed] = useState(false)

  const onDragStart = (e, engineType, def) => {
    e.dataTransfer.setData('flow/engineType', engineType)
    e.dataTransfer.setData('flow/label',      def.name)
    e.dataTransfer.setData('flow/color',      def.color || 'blue')
    e.dataTransfer.effectAllowed = 'move'
  }

  const entries = Object.entries(nodeTypes)

  return (
    <aside className="w-60 bg-[#111] border-r border-white/[0.06] flex flex-col h-full shrink-0">

      {/* ── Dropdown header ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]
          hover:bg-white/[0.03] transition-colors w-full text-left shrink-0"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="w-3.5 h-3.5 text-white/40">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest flex-1">
          Nodes
        </span>
        {entries.length > 0 && (
          <span className="text-white/25 text-[10px] font-mono">{entries.length}</span>
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`w-3.5 h-3.5 text-white/30 transition-transform ${collapsed ? '-rotate-90' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* ── Node list ── */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-hide">
          {entries.length === 0 && (
            <p className="text-white/20 text-xs px-1 italic">Loading…</p>
          )}

          {entries.map(([key, def]) => {
            const c = ICON_COLORS[def.color] || ICON_COLORS.blue
            const icon = NODE_ICONS[key]
            return (
              <div
                key={key}
                draggable
                onDragStart={e => onDragStart(e, key, def)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border bg-white/[0.02]
                  cursor-grab active:cursor-grabbing transition-all duration-150
                  ${c.card}
                `}
              >
                {/* Icon box */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.box}`}>
                  {icon}
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <div className={`text-sm font-semibold leading-tight ${c.name}`}>
                    {def.name}
                  </div>
                  <div className="text-[10px] text-white/35 font-normal leading-snug mt-0.5 line-clamp-2">
                    {def.description}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Hint */}
          <div className="mt-1 p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-white/25 text-[10px] leading-relaxed">
              Drag a node onto the canvas to add it.
            </p>
          </div>
        </div>
      )}
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
      const res = await fetch(`${API}/workflows/${workflowId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ workflow_json: { nodes, edges } }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch {
      alert('Error saving workflow')
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
      alert(`Failed to load JSON: ${err.message}`)
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
    fetch(`${API}/workflows/${workflowId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.workflow_json) {
          setNodes(data.workflow_json.nodes || [])
          setEdges(data.workflow_json.edges || [])
        }
      })
      .catch(console.error)
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
    params => setEdges(eds => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
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
          zoomable pannable
          nodeColor={n => {
            const c = n.data?.color
            const map = { orange:'#f97316', purple:'#a855f7', green:'#22c55e', yellow:'#eab308', teal:'#14b8a6', indigo:'#6366f1', gray:'#9ca3af' }
            return map[c] || '#3b82f6'
          }}
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
          maskColor="rgba(0,0,0,0.75)"
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

  // ── Run the workflow ───────────────────────────────────────────────────
  const handleRun = async () => {
    if (!workflowId) return
    setRunning(true)
    setExecResult(null)
    try {
      const res  = await fetch(`${API}/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await res.json()
      setExecResult(data)
    } catch (err) {
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
