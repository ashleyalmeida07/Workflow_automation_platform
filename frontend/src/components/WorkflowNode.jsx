/* WorkflowNode.jsx – polished node cards with glowing handles + execution state */
import { Handle, Position } from "@xyflow/react";
import { useContext } from "react";
import { DarkModeCtx } from "../pages/Flow";
import { T } from "../theme";

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
  webhook_trigger: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 16.98h-5.99c-1.66 0-2.99-1.34-2.99-3s1.34-3 2.99-3H20"/><polyline points="15 14 18 11 15 8"/><path d="M6 7.02h6c1.66 0 3 1.34 3 3s-1.34 3-3 3H4"/><polyline points="9 9 6 12 9 15"/></svg>),
  cron_scheduler:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="16" cy="16" r="4"/><polyline points="16 14 16 16 17.5 17"/></svg>),
  email:           (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
  slack:           (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>),
  local_storage:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>),
  postgres_db:     (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>),
  openai:          (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>),
  file_upload:     (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>),
  parallel_execution: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>),
  loop_node:       (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>),
  custom_node:     (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>),
  docker_deploy:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>),
};

function handleStyle(color) {
  return { width: 10, height: 10, background: color, border: "2px solid rgba(0,0,0,0.5)" };
}



export default function WorkflowNode({ data, selected }) {
  const { dark } = useContext(DarkModeCtx);
  const t = dark ? T.dark : T.light;

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
    <div className={`relative min-w-[180px] max-w-[240px] rounded-2xl border backdrop-blur-sm cursor-default select-none transition-all duration-300 ${t.bgPanel} ${p.bg} ${borderClass} ${isFailed ? "node-failed" : ""} ${selected ? `ring-2 ${p.ring} shadow-lg` : "shadow-sm"} ${glowClass}`}>

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

      <div className={`px-3 py-2 text-[11px] ${t.textMuted} font-mono space-y-1`}>
        {data.engine_type === "http_request" && data.settings?.url && (
          <div className="truncate"><span className={t.textFaint}>{data.settings.method || "GET"} </span><span className={t.textSecondary}>{data.settings.url}</span></div>
        )}
        {data.engine_type === "delay" && data.settings?.seconds && (
          <div><span className={t.textFaint}>wait </span><span className={t.textSecondary}>{data.settings.seconds}s</span></div>
        )}
        {data.engine_type === "condition" && data.settings?.field && (
          <div className="truncate"><span className={t.textSecondary}>{data.settings.field} </span><span className={t.textFaint}>{data.settings.operator} </span><span className={t.textSecondary}>{data.settings.value}</span></div>
        )}
        {data.engine_type === "logger" && data.settings?.message && (
          <div className={`truncate ${t.textSecondary}`}>{data.settings.message}</div>
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

