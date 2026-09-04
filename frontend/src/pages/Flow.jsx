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

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

// Node-type → color mapping (matches node_types.py "color" field)
const SIDEBAR_COLORS = {
  orange: 'border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20',
  blue:   'border-blue-500/40   bg-blue-500/10   text-blue-400   hover:bg-blue-500/20',
  yellow: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20',
  green:  'border-green-500/40  bg-green-500/10  text-green-400  hover:bg-green-500/20',
  purple: 'border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
}

const ICONS = {
  trigger:      '⚡',
  http_request: '🌐',
  condition:    '⟔',
  action:       '▶',
  end:          '⏹',
}

// Stable map given to ReactFlow (must live outside component to avoid re-render loops)
const RF_NODE_TYPES = { workflowNode: WorkflowNode }

let _nodeId = 0
const newId  = () => `n_${Date.now()}_${_nodeId++}`

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
function Sidebar({ nodeTypes }) {
  const onDragStart = (e, engineType, def) => {
    // Store the type info so the canvas can read it on drop
    e.dataTransfer.setData('flow/engineType', engineType)
    e.dataTransfer.setData('flow/label',      def.name)
    e.dataTransfer.setData('flow/color',      def.color || 'blue')
    e.dataTransfer.effectAllowed = 'move'
  }

  const entries = Object.entries(nodeTypes)

  return (
    <aside className="w-56 bg-[#111] border-r border-white/[0.06] p-3 flex flex-col gap-2 h-full overflow-y-auto shrink-0">
      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest py-1 px-1">
        Nodes
      </p>

      {entries.length === 0 && (
        <p className="text-white/20 text-xs px-1 italic">Loading…</p>
      )}

      {entries.map(([key, def]) => {
        const cls = SIDEBAR_COLORS[def.color] || SIDEBAR_COLORS.blue
        return (
          <div
            key={key}
            draggable
            onDragStart={e => onDragStart(e, key, def)}
            className={`p-2.5 border rounded-xl text-sm font-medium cursor-grab
              active:cursor-grabbing transition-colors flex items-start gap-2.5 ${cls}`}
          >
            <span className="text-base mt-0.5">{ICONS[key] || '●'}</span>
            <div>
              <div className="leading-tight">{def.name}</div>
              <div className="text-[10px] opacity-50 font-normal leading-snug mt-0.5">
                {def.description}
              </div>
            </div>
          </div>
        )
      })}

      <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/10">
        <p className="text-white/30 text-[10px] leading-relaxed">
          Drag nodes onto the canvas. Click a node to configure it. Connect nodes by dragging between handles.
        </p>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────
// Topbar
// ─────────────────────────────────────────────
function Topbar({ workflowId, running, onRun, getFlowState }) {
  const [saving, setSaving] = useState(false)

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
    animated: true,
    style: {
      stroke: '#6366f1',
      strokeWidth: 2,
      filter: 'drop-shadow(0 0 4px #6366f188)',
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#6366f1',
      width: 16,
      height: 16,
    },
  }

  const onConnect = useCallback(
    params => setEdges(eds => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges],
  )

  // ── Selection ────────────────────────────────────────────────────────
  const onNodeClick   = useCallback((_, node) => onNodeSelect(node), [onNodeSelect])
  const onPaneClick   = useCallback(() => { onNodeSelect(null); setCtxMenu(null) }, [onNodeSelect])

  // ── Context menu (right-click to delete) ─────────────────────────────
  const onNodeContextMenu = useCallback((e, node) => {
    e.preventDefault()
    setCtxMenu({ id: node.id, x: e.clientX, y: e.clientY })
  }, [])

  const deleteNode = useCallback(id => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    onNodeSelect(null)
    setCtxMenu(null)
  }, [setNodes, setEdges, onNodeSelect])

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
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '6 3' }}
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

      {/* Right-click context menu */}
      {ctxMenu && (
        <div
          style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 999 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px]"
        >
          <button
            onClick={() => deleteNode(ctxMenu.id)}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5"
          >
            🗑 Delete node
          </button>
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

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a]">
      <ReactFlowProvider>
        <Topbar
          workflowId={workflowId}
          running={running}
          onRun={handleRun}
          getFlowState={getFlowState}
        />

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
