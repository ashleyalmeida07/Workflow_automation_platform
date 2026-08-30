/* WorkflowNode.jsx
   A single custom React-Flow node.  All node types share this component;
   the appearance is driven by the `color` and `engine_type` stored in node.data.
*/

import { Handle, Position } from '@xyflow/react'

const COLORS = {
  orange: { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  dot: 'bg-orange-500',  text: 'text-orange-400'  },
  blue:   { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    dot: 'bg-blue-500',    text: 'text-blue-400'    },
  yellow: { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  dot: 'bg-yellow-500',  text: 'text-yellow-400'  },
  green:  { bg: 'bg-green-500/10',   border: 'border-green-500/30',   dot: 'bg-green-500',   text: 'text-green-400'   },
  purple: { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  dot: 'bg-purple-500',  text: 'text-purple-400'  },
}

const ICONS = {
  trigger:      '⚡',
  http_request: '🌐',
  condition:    '⟔',
  action:       '▶',
  end:          '⏹',
}

export default function WorkflowNode({ data, selected }) {
  const color = COLORS[data.color] || COLORS.blue
  const icon  = ICONS[data.engine_type] || '●'

  return (
    <div
      className={`
        min-w-[160px] rounded-xl border px-3 py-2.5 text-sm font-medium
        transition-all duration-150 cursor-default
        ${color.bg} ${color.border} ${color.text}
        ${selected ? 'ring-2 ring-white/30 shadow-lg' : ''}
      `}
    >
      {/* top handle (input) */}
      <Handle type="target" position={Position.Top}
        style={{ background: '#555', width: 8, height: 8 }} />

      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{icon}</span>
        <span>{data.label}</span>
      </div>

      {/* show url snippet for http nodes */}
      {data.engine_type === 'http_request' && data.settings?.url && (
        <div className="mt-1.5 text-[10px] opacity-60 font-mono truncate max-w-[180px]">
          {data.settings.method || 'GET'} {data.settings.url}
        </div>
      )}

      {/* bottom handle (output) */}
      <Handle type="source" position={Position.Bottom}
        style={{ background: '#555', width: 8, height: 8 }} />
    </div>
  )
}
