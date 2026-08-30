/*
  Flow.jsx – the main workflow editor page.

  Layout:
    ┌─────────────┬──────────────────────────────┬──────────────────┐
    │  Topbar (save / run)                                           │
    ├─────────────┼──────────────────────────────┼──────────────────┤
    │  Sidebar    │   React-Flow canvas          │  Config Panel    │
    │  (node lib) │                              │  (when selected) │
    └─────────────┴──────────────────────────────┴──────────────────┘

  State:
    - nodes / edges  – React-Flow state
    - selectedNode   – which node is selected (drives config panel)
    - nodeTypes      – fetched from GET /node-types
    - running        – true while /execute is in-flight
    - execResult     – last execution result (shown in floating panel)
*/

import { useCallback, useRef, useEffect, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Link, useLocation } from 'react-router-dom'

import WorkflowNode        from '../components/WorkflowNode'
import NodeConfigPanel     from '../components/NodeConfigPanel'
import ExecutionResultPanel from '../components/ExecutionResultPanel'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

let nodeCounter = 100
const nextId = () => `node_${nodeCounter++}`

// React-Flow needs a stable nodeTypes map (defined outside component)
const RF_NODE_TYPES = { workflowNode: WorkflowNode }

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar – shows available node types fetched from the backend
// ─────────────────────────────────────────────────────────────────────────────
const COLOR_CLASSES = {
  orange: 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20',
  blue:   'border-blue-500/30   bg-blue-500/10   text-blue-400   hover:bg-blue-500/20',
  yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20',
  green:  'border-green-500/30  bg-green-500/10  text-green-400  hover:bg-green-500/20',
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
}

const ICONS = {
  trigger:      '⚡',
  http_request: '🌐',
  condition:    '⟔',
  action:       '▶',
  end:          '⏹',
}

function Sidebar({ nodeTypes }) {
  const onDragStart = (event, engineType, typeDef) => {
    event.dataTransfer.setData('app/engineType', engineType)
    event.dataTransfer.setData('app/label',      typeDef.name)
    event.dataTransfer.setData('app/color',      typeDef.color || 'blue')
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="w-56 bg-[#111] border-r border-white/[0.06] p-4 flex flex-col gap-2.5 h-full overflow-y-auto shrink-0">
      <div className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Nodes</div>

      {Object.entries(nodeTypes).map(([key, def]) => {
        const colorCls = COLOR_CLASSES[def.color] || COLOR_CLASSES.blue
        return (
          <div
            key={key}
            draggable
            onDragStart={e => onDragStart(e, key, def)}
            className={`p-2.5 border rounded-xl text-sm font-medium cursor-grab transition-colors flex items-center gap-2.5 ${colorCls}`}
          >
            <span className="text-base">{ICONS[key] || '●'}</span>
            <div>
              <div>{def.name}</div>
              <div className="text-[10px] opacity-50 font-normal">{def.description}</div>
            </div>
          </div>
        )
      })}
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Topbar
// ─────────────────────────────────────────────────────────────────────────────
function Topbar({ workflowId, running, onRun }) {
  const { getNodes, getEdges } = useReactFlow()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!workflowId) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/workflows/${workflowId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ workflow_json: { nodes: getNodes(), edges: getEdges() } }),
      })
      if (!res.ok) throw new Error('Failed to save')
    } catch (err) {
      alert('Error saving workflow')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-14 border-b border-white/[0.06] flex items-center px-4 shrink-0 bg-[#0a0a0a] justify-between z-10 relative">
      <Link to="/dashboard"
        className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <div className="text-white font-semibold text-sm">Flow Editor</div>

      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={saving || !workflowId}
          className="px-4 py-1.5 bg-white/5 border border-white/10 text-white/80 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40">
          {saving ? 'Saving…' : 'Save'}
        </button>

        <button onClick={onRun} disabled={running || !workflowId}
          className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center gap-1.5">
          {running
            ? <><span className="animate-spin text-base">⟳</span> Running…</>
            : <><span>▶</span> Run</>}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FlowCanvas
// ─────────────────────────────────────────────────────────────────────────────
function FlowCanvas({ workflowId, nodeTypes, onNodeSelect, onNodesUpdated }) {
  const wrapper = useRef(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { screenToFlowPosition } = useReactFlow()
  const [contextMenu, setContextMenu] = useState(null)

  // expose nodes/edges updater to parent
  useEffect(() => { onNodesUpdated?.(nodes, edges) }, [nodes, edges])

  // load workflow
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

  const onConnect = useCallback(
    params => setEdges(eds => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const onDragOver = useCallback(event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(event => {
    event.preventDefault()
    const engineType = event.dataTransfer.getData('app/engineType')
    const label      = event.dataTransfer.getData('app/label')
    const color      = event.dataTransfer.getData('app/color')
    if (!engineType) return

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const typeDef  = nodeTypes[engineType] || {}

    // seed default settings
    const defaultSettings = {}
    for (const [k, def] of Object.entries(typeDef.settings || {})) {
      defaultSettings[k] = def.default ?? ''
    }

    const newNode = {
      id:   nextId(),
      type: 'workflowNode',
      position,
      data: {
        label:       label,
        engine_type: engineType,
        color:       color,
        settings:    defaultSettings,
      },
    }
    setNodes(nds => nds.concat(newNode))
  }, [screenToFlowPosition, setNodes, nodeTypes])

  const onNodeClick = useCallback((_, node) => onNodeSelect(node), [onNodeSelect])
  const onPaneClick = useCallback(() => {
    onNodeSelect(null)
    setContextMenu(null)
  }, [onNodeSelect])

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault()
    setContextMenu({ id: node.id, x: event.clientX, y: event.clientY })
  }, [])

  const deleteNode = useCallback(id => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    setContextMenu(null)
    onNodeSelect(null)
  }, [setNodes, setEdges, onNodeSelect])

  // update a node's settings from the config panel
  const updateNodeSettings = useCallback((nodeId, newSettings) => {
    setNodes(nds => nds.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, settings: newSettings } } : n
    ))
  }, [setNodes])

  // expose updater via ref trick
  FlowCanvas.updateNodeSettings = updateNodeSettings

  return (
    <div className="flex-1 h-full relative" ref={wrapper}>
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
        fitView
        colorMode="dark"
        className="bg-[#0c0c0c]"
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Controls className="bg-[#1a1a1a] border-white/10" />
        <MiniMap zoomable pannable
          nodeColor={n => {
            const c = n.data?.color
            return c === 'orange' ? '#f97316' : c === 'purple' ? '#a855f7'
                 : c === 'green'  ? '#22c55e' : c === 'yellow' ? '#eab308' : '#3b82f6'
          }}
          style={{ backgroundColor: '#111' }}
          maskColor="rgba(0,0,0,0.7)"
        />
        <Background variant="dots" gap={16} size={1} color="#333" />
      </ReactFlow>

      {/* right-click context menu */}
      {contextMenu && (
        <div
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 50 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1 text-sm min-w-[140px]"
        >
          <button
            onClick={() => deleteNode(contextMenu.id)}
            className="w-full text-left px-3 py-2 text-red-400 hover:bg-white/5"
          >
            Delete node
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────
export default function Flow() {
  const location   = useLocation()
  const workflowId = location.state?.workflowId

  const [nodeTypes,     setNodeTypes]     = useState({})
  const [selectedNode,  setSelectedNode]  = useState(null)
  const [running,       setRunning]       = useState(false)
  const [execResult,    setExecResult]    = useState(null)

  // current nodes/edges (kept in sync by FlowCanvas)
  const latestNodesRef = useRef([])
  const latestEdgesRef = useRef([])

  // fetch node-types catalogue once
  useEffect(() => {
    fetch(`${API}/node-types/`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setNodeTypes)
      .catch(console.error)
  }, [])

  // update a selected node's settings
  const handleSettingsUpdate = (nodeId, newSettings) => {
    FlowCanvas.updateNodeSettings?.(nodeId, newSettings)
    // also update selectedNode so the panel re-renders
    setSelectedNode(prev =>
      prev?.id === nodeId
        ? { ...prev, data: { ...prev.data, settings: newSettings } }
        : prev
    )
  }

  // run the workflow
  const handleRun = async () => {
    if (!workflowId) return
    setRunning(true)
    setExecResult(null)
    try {
      const res = await fetch(`${API}/workflows/${workflowId}/execute`, {
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

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a]">
      <ReactFlowProvider>
        <Topbar workflowId={workflowId} running={running} onRun={handleRun} />

        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar nodeTypes={nodeTypes} />

          <FlowCanvas
            workflowId={workflowId}
            nodeTypes={nodeTypes}
            onNodeSelect={setSelectedNode}
            onNodesUpdated={(n, e) => {
              latestNodesRef.current = n
              latestEdgesRef.current = e
            }}
          />

          {selectedNode && (
            <NodeConfigPanel
              node={selectedNode}
              nodeTypes={nodeTypes}
              onUpdate={handleSettingsUpdate}
              onClose={() => setSelectedNode(null)}
            />
          )}

          {execResult && (
            <ExecutionResultPanel
              result={execResult}
              onClose={() => setExecResult(null)}
            />
          )}
        </div>
      </ReactFlowProvider>
    </div>
  )
}
