/* WorkflowNode.jsx – polished node cards with glowing handles + execution state */
import { Handle, Position } from "@xyflow/react";

const PALETTE = {
  orange: { border:"border-orange-500/40", bg:"bg-gradient-to-b from-orange-500/15 to-orange-500/5", header:"bg-orange-500/20", text:"text-orange-300", handle:"#f97316", ring:"ring-orange-500/50", badge:"bg-orange-500/20 text-orange-300" },
  blue:   { border:"border-blue-500/40",   bg:"bg-gradient-to-b from-blue-500/15 to-blue-500/5",   header:"bg-blue-500/20",   text:"text-blue-300",   handle:"#3b82f6", ring:"ring-blue-500/50",   badge:"bg-blue-500/20 text-blue-300"   },
  yellow: { border:"border-yellow-500/40", bg:"bg-gradient-to-b from-yellow-500/15 to-yellow-500/5", header:"bg-yellow-500/20", text:"text-yellow-300", handle:"#eab308", ring:"ring-yellow-500/50", badge:"bg-yellow-500/20 text-yellow-300" },
  green:  { border:"border-green-500/40",  bg:"bg-gradient-to-b from-green-500/15 to-green-500/5",  header:"bg-green-500/20",  text:"text-green-300",  handle:"#22c55e", ring:"ring-green-500/50",  badge:"bg-green-500/20 text-green-300"  },
  purple: { border:"border-purple-500/40", bg:"bg-gradient-to-b from-purple-500/15 to-purple-500/5", header:"bg-purple-500/20", text:"text-purple-300", handle:"#a855f7", ring:"ring-purple-500/50", badge:"bg-purple-500/20 text-purple-300" },
  gray:   { border:"border-gray-500/40",   bg:"bg-gradient-to-b from-gray-600/15 to-gray-600/5",   header:"bg-gray-600/20",   text:"text-gray-300",   handle:"#9ca3af", ring:"ring-gray-500/50",   badge:"bg-gray-600/20 text-gray-300"   },
  indigo: { border:"border-indigo-500/40", bg:"bg-gradient-to-b from-indigo-500/15 to-indigo-500/5", header:"bg-indigo-500/20", text:"text-indigo-300", handle:"#6366f1", ring:"ring-indigo-500/50", badge:"bg-indigo-500/20 text-indigo-300" },
  teal:   { border:"border-teal-500/40",   bg:"bg-gradient-to-b from-teal-500/15 to-teal-500/5",   header:"bg-teal-500/20",   text:"text-teal-300",   handle:"#14b8a6", ring:"ring-teal-500/50",   badge:"bg-teal-500/20 text-teal-300"   },
};

const ICONS = {
  trigger:         (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="5,3 19,12 5,21" /></svg>),
  http_request:    (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>),
  delay:           (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>),
  python_function: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>),
  condition:       (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>),
  logger:          (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>),
  action:          (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>),
  end:             (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>),
};

function handleStyle(color) {
  return { width: 10, height: 10, background: color, border: "2px solid rgba(0,0,0,0.5)" };
}



export default function WorkflowNode({ data, selected }) {
  const p      = PALETTE[data.color] || PALETTE.blue;
  const icon   = ICONS[data.engine_type];
  const status = data._status;

  const isRunning = status === "running";
  const isSuccess = status === "success";
  const isFailed  = status === "failed";

  const borderClass = isRunning ? "border-yellow-400/80" : isSuccess ? "border-green-400/80" : isFailed ? "border-red-500/80" : p.border;
  const glowClass   = isRunning ? "shadow-yellow-400/40 shadow-lg" : isSuccess ? "shadow-green-400/40 shadow-lg" : isFailed ? "shadow-red-500/40 shadow-lg" : "";
  const labelColor  = isRunning ? "text-yellow-300" : isSuccess ? "text-green-300" : isFailed ? "text-red-300" : p.text;

  return (
    <div className={`relative min-w-[180px] max-w-[240px] rounded-2xl border backdrop-blur-sm cursor-default select-none transition-all duration-300 ${p.bg} ${borderClass} ${isFailed ? "node-failed" : ""} ${selected ? `ring-2 ${p.ring} shadow-lg` : "shadow-sm"} ${glowClass}`}>

      {isRunning && (
        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center z-40 backdrop-blur-[2px]">
          <svg className="animate-spin w-8 h-8 text-yellow-400 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {isSuccess && (
        <div className="node-success-badge absolute -top-2.5 -right-2.5 z-30 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
      )}
      {isFailed && (
        <div className="absolute -top-2.5 -right-2.5 z-30 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </div>
      )}

      {/* trigger nodes have no input — hide the target handle */}
      {data.engine_type !== "trigger" && (
        <Handle type="target" position={Position.Top} style={handleStyle(p.handle)} />
      )}

      <div className={`flex items-center gap-2.5 px-3 py-2.5 ${p.header} rounded-t-2xl border-b ${borderClass}`}>
        <span className={`${p.text} opacity-90 ${isRunning ? "animate-spin" : ""}`}>
          {isRunning
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            : icon}
        </span>
        <span className={`text-sm font-semibold ${labelColor}`}>{data.label}</span>

        {isRunning && <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-yellow-400/20 text-yellow-300 uppercase tracking-wide animate-pulse">running…</span>}
        {isSuccess && <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-300 uppercase tracking-wide">done ?</span>}
        {isFailed  && <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 uppercase tracking-wide">failed ?</span>}
        {!status   && <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-md ${p.badge} opacity-70`}>{data.engine_type}</span>}
      </div>

      <div className="px-3 py-2 text-[11px] text-white/40 font-mono space-y-1">
        {data.engine_type === "http_request" && data.settings?.url && (
          <div className="truncate"><span className="text-white/25">{data.settings.method || "GET"} </span><span className="text-white/50">{data.settings.url}</span></div>
        )}
        {data.engine_type === "delay" && data.settings?.seconds && (
          <div><span className="text-white/25">wait </span><span className="text-white/50">{data.settings.seconds}s</span></div>
        )}
        {data.engine_type === "condition" && data.settings?.field && (
          <div className="truncate"><span className="text-white/50">{data.settings.field} </span><span className="text-white/25">{data.settings.operator} </span><span className="text-white/50">{data.settings.value}</span></div>
        )}
        {data.engine_type === "logger" && data.settings?.message && (
          <div className="truncate text-white/50">{data.settings.message}</div>
        )}
        {!["http_request","delay","condition","logger"].includes(data.engine_type) && <div className="h-1" />}
      </div>

      <Handle type="source" position={Position.Bottom} style={handleStyle(p.handle)} />

      {data.engine_type === "condition" && (
        <>
          <Handle id="true"  type="source" position={Position.Right} style={{ ...handleStyle("#22c55e"), top:"50%" }} />
          <Handle id="false" type="source" position={Position.Left}  style={{ ...handleStyle("#ef4444"), top:"50%" }} />
          <span className="absolute right-[-28px] top-[calc(50%-8px)] text-[9px] text-green-400 font-bold select-none">T</span>
          <span className="absolute left-[-16px] top-[calc(50%-8px)] text-[9px] text-red-400 font-bold select-none">F</span>
        </>
      )}
    </div>
  );
}

