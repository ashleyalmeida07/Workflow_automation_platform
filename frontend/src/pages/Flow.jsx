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

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

let id = 0;
const getId = () => `dndnode_${id++}`;

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start Trigger' },
    position: { x: 250, y: 50 },
  },
]

const initialEdges = []

function Sidebar() {
  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-[#111111] border-r border-white/[0.06] p-4 flex flex-col gap-3 h-full overflow-y-auto">
      <div className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Nodes</div>
      
      <div 
        className="p-3 border border-orange-500/30 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium cursor-grab hover:bg-orange-500/20 transition-colors flex items-center gap-2" 
        onDragStart={(event) => onDragStart(event, 'input', 'Trigger')} 
        draggable
      >
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        Trigger Event
      </div>
      
      <div 
        className="p-3 border border-blue-500/30 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-medium cursor-grab hover:bg-blue-500/20 transition-colors flex items-center gap-2" 
        onDragStart={(event) => onDragStart(event, 'default', 'Action')} 
        draggable
      >
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        Action Step
      </div>

      <div 
        className="p-3 border border-green-500/30 rounded-xl bg-green-500/10 text-green-400 text-sm font-medium cursor-grab hover:bg-green-500/20 transition-colors flex items-center gap-2" 
        onDragStart={(event) => onDragStart(event, 'default', 'Condition')} 
        draggable
      >
        <div className="w-2 h-2 rounded-full bg-green-500" />
        Condition Filter
      </div>
      
      <div 
        className="p-3 border border-purple-500/30 rounded-xl bg-purple-500/10 text-purple-400 text-sm font-medium cursor-grab hover:bg-purple-500/20 transition-colors flex items-center gap-2" 
        onDragStart={(event) => onDragStart(event, 'output', 'End')} 
        draggable
      >
        <div className="w-2 h-2 rounded-full bg-purple-500" />
        End / Output
      </div>

      <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
        <p className="text-white/40 text-xs leading-relaxed">
          Drag these nodes into the canvas to build your workflow. Connect them by dragging from a handle.
        </p>
      </div>
    </aside>
  );
}

function Topbar({ workflowId }) {
  const { getNodes, getEdges } = useReactFlow()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!workflowId) return
    setSaving(true)
    try {
      const nodes = getNodes()
      const edges = getEdges()
      const res = await fetch(`${API}/workflows/${workflowId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          workflow_json: { nodes, edges },
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
    } catch (err) {
      console.error(err)
      alert('Error saving workflow')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-14 border-b border-white/[0.06] flex items-center px-4 shrink-0 bg-[#0a0a0a] justify-between z-10 relative">
      <Link
        to="/dashboard"
        className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>
      
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="text-white font-semibold text-sm">
          Flow Editor
        </div>
      </div>

      <div className="w-[150px] flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving || !workflowId}
          className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Workflow'}
        </button>
      </div>
    </div>
  )
}

function FlowCanvas({ workflowId }) {
  const reactFlowWrapper = useRef(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { screenToFlowPosition } = useReactFlow()

  useEffect(() => {
    if (!workflowId) return
    fetch(`${API}/workflows/${workflowId}`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.workflow_json) {
          setNodes(data.workflow_json.nodes || [])
          setEdges(data.workflow_json.edges || [])
        }
      })
      .catch(err => console.error(err))
  }, [workflowId, setNodes, setEdges])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow/type')
      const label = event.dataTransfer.getData('application/reactflow/label')

      if (typeof type === 'undefined' || !type) {
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${label}` },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [screenToFlowPosition, setNodes],
  )

  return (
    <div className="flex flex-1 h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        colorMode="dark"
        className="bg-[#0c0c0c]"
      >
        <Controls className="bg-[#1a1a1a] border-white/10 text-white fill-white" />
        <MiniMap 
          zoomable 
          pannable 
          nodeColor={(n) => {
            if (n.type === 'input') return '#f97316'
            if (n.type === 'output') return '#a855f7'
            return '#3b82f6'
          }} 
          style={{ backgroundColor: '#111' }}
          maskColor="rgba(0,0,0,0.7)"
        />
        <Background variant="dots" gap={16} size={1} color="#333" />
      </ReactFlow>
    </div>
  )
}

export default function Flow() {
  const location = useLocation()
  const workflowId = location.state?.workflowId

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a]">
      <ReactFlowProvider>
        <Topbar workflowId={workflowId} />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <FlowCanvas workflowId={workflowId} />
        </div>
      </ReactFlowProvider>
    </div>
  )
}
