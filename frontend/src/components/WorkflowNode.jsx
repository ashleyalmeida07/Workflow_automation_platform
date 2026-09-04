/* WorkflowNode.jsx – polished node cards with glowing handles */
import { Handle, Position } from "@xyflow/react";

// Color palette per node type
const PALETTE = {
  orange: {
    glow:    "shadow-orange-500/30",
    border:  "border-orange-500/40",
    bg:      "bg-gradient-to-b from-orange-500/15 to-orange-500/5",
    header:  "bg-orange-500/20",
    text:    "text-orange-300",
    handle:  "#f97316",
    ring:    "ring-orange-500/50",
    badge:   "bg-orange-500/20 text-orange-300",
  },
  blue: {
    glow:    "shadow-blue-500/30",
    border:  "border-blue-500/40",
    bg:      "bg-gradient-to-b from-blue-500/15 to-blue-500/5",
    header:  "bg-blue-500/20",
    text:    "text-blue-300",
    handle:  "#3b82f6",
    ring:    "ring-blue-500/50",
    badge:   "bg-blue-500/20 text-blue-300",
  },
  yellow: {
    glow:    "shadow-yellow-500/30",
    border:  "border-yellow-500/40",
    bg:      "bg-gradient-to-b from-yellow-500/15 to-yellow-500/5",
    header:  "bg-yellow-500/20",
    text:    "text-yellow-300",
    handle:  "#eab308",
    ring:    "ring-yellow-500/50",
    badge:   "bg-yellow-500/20 text-yellow-300",
  },
  green: {
    glow:    "shadow-green-500/30",
    border:  "border-green-500/40",
    bg:      "bg-gradient-to-b from-green-500/15 to-green-500/5",
    header:  "bg-green-500/20",
    text:    "text-green-300",
    handle:  "#22c55e",
    ring:    "ring-green-500/50",
    badge:   "bg-green-500/20 text-green-300",
  },
  purple: {
    glow:    "shadow-purple-500/30",
    border:  "border-purple-500/40",
    bg:      "bg-gradient-to-b from-purple-500/15 to-purple-500/5",
    header:  "bg-purple-500/20",
    text:    "text-purple-300",
    handle:  "#a855f7",
    ring:    "ring-purple-500/50",
    badge:   "bg-purple-500/20 text-purple-300",
  },
  gray: {
    glow:    "shadow-gray-500/20",
    border:  "border-gray-500/40",
    bg:      "bg-gradient-to-b from-gray-600/15 to-gray-600/5",
    header:  "bg-gray-600/20",
    text:    "text-gray-300",
    handle:  "#9ca3af",
    ring:    "ring-gray-500/50",
    badge:   "bg-gray-600/20 text-gray-300",
  },
  indigo: {
    glow:    "shadow-indigo-500/30",
    border:  "border-indigo-500/40",
    bg:      "bg-gradient-to-b from-indigo-500/15 to-indigo-500/5",
    header:  "bg-indigo-500/20",
    text:    "text-indigo-300",
    handle:  "#6366f1",
    ring:    "ring-indigo-500/50",
    badge:   "bg-indigo-500/20 text-indigo-300",
  },
  teal: {
    glow:    "shadow-teal-500/30",
    border:  "border-teal-500/40",
    bg:      "bg-gradient-to-b from-teal-500/15 to-teal-500/5",
    header:  "bg-teal-500/20",
    text:    "text-teal-300",
    handle:  "#14b8a6",
    ring:    "ring-teal-500/50",
    badge:   "bg-teal-500/20 text-teal-300",
  },
};

// SVG icons for each node type
const ICONS = {
  trigger: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  ),
  http_request: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  delay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  python_function: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  condition: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  ),
  logger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  action: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  end: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

// Handle style factory
function handleStyle(color, isHovered) {
  return {
    width: 12,
    height: 12,
    background: color,
    border: "2px solid rgba(0,0,0,0.6)",
    boxShadow: `0 0 8px ${color}88`,
    transition: "all 0.15s ease",
    cursor: "crosshair",
  };
}

export default function WorkflowNode({ data, selected }) {
  const p = PALETTE[data.color] || PALETTE.blue;
  const icon = ICONS[data.engine_type];

  return (
    <div
      className={`
        relative min-w-[180px] max-w-[240px] rounded-2xl border
        backdrop-blur-sm shadow-lg
        transition-all duration-200 cursor-default select-none
        ${p.bg} ${p.border} ${p.glow}
        ${selected ? `ring-2 ${p.ring} shadow-xl` : "shadow-md"}
      `}
    >
      {/* Input handle — top center */}
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle(p.handle)}
      />

      {/* Header */}
      <div className={`flex items-center gap-2.5 px-3 py-2.5 ${p.header} rounded-t-2xl border-b ${p.border}`}>
        <span className={`${p.text} opacity-90`}>{icon}</span>
        <span className={`text-sm font-semibold ${p.text}`}>{data.label}</span>

        {/* Engine type badge */}
        <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-md ${p.badge} opacity-70`}>
          {data.engine_type}
        </span>
      </div>

      {/* Body — show relevant setting snippets */}
      <div className="px-3 py-2 text-[11px] text-white/40 font-mono space-y-1">
        {data.engine_type === "http_request" && data.settings?.url && (
          <div className="truncate">
            <span className="text-white/25">{data.settings.method || "GET"} </span>
            <span className="text-white/50">{data.settings.url}</span>
          </div>
        )}
        {data.engine_type === "delay" && data.settings?.seconds && (
          <div>
            <span className="text-white/25">wait </span>
            <span className="text-white/50">{data.settings.seconds}s</span>
          </div>
        )}
        {data.engine_type === "condition" && data.settings?.field && (
          <div className="truncate">
            <span className="text-white/50">{data.settings.field} </span>
            <span className="text-white/25">{data.settings.operator} </span>
            <span className="text-white/50">{data.settings.value}</span>
          </div>
        )}
        {data.engine_type === "logger" && data.settings?.message && (
          <div className="truncate text-white/50">{data.settings.message}</div>
        )}
        {/* spacer for nodes with no preview */}
        {!["http_request","delay","condition","logger"].includes(data.engine_type) && (
          <div className="h-1" />
        )}
      </div>

      {/* Output handle — bottom center */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle(p.handle)}
      />

      {/* Condition node — extra True/False handles on left/right */}
      {data.engine_type === "condition" && (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            style={{ ...handleStyle("#22c55e"), top: "50%" }}
          />
          <Handle
            id="false"
            type="source"
            position={Position.Left}
            style={{ ...handleStyle("#ef4444"), top: "50%" }}
          />
          {/* Labels */}
          <span className="absolute right-[-28px] top-[calc(50%-8px)] text-[9px] text-green-400 font-bold select-none">T</span>
          <span className="absolute left-[-16px] top-[calc(50%-8px)] text-[9px] text-red-400 font-bold select-none">F</span>
        </>
      )}
    </div>
  );
}
