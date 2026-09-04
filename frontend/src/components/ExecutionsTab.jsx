/*
  ExecutionsTab.jsx
  Bottom panel showing all past executions in a clean table.
  Click a row to see step details in a side drawer.
*/
import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function duration(start, end) {
  if (!start || !end) return "—";
  const ms = new Date(end) - new Date(start);
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ── Step detail drawer ─────────────────────────────────────────────────────
function StepDrawer({ ex, onClose }) {
  return (
    <div className="absolute inset-0 z-20 flex">
      {/* backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* panel */}
      <div className="w-[420px] bg-[#111] border-l border-white/10 flex flex-col h-full overflow-hidden">
        {/* header */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">Execution #{ex.id}</p>
            <p className="text-white/40 text-xs mt-0.5">{fmt(ex.started_at)}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 text-lg">✕</button>
        </div>

        {/* summary chips */}
        <div className="px-4 py-3 flex gap-3 border-b border-white/[0.06] shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
            ${ex.status === "completed"
              ? "bg-green-500/15 text-green-400 border border-green-500/25"
              : "bg-red-500/15 text-red-400 border border-red-500/25"}`}>
            {ex.status}
          </span>
          <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
            {ex.steps?.length ?? 0} steps
          </span>
          <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
            {duration(ex.started_at, ex.finished_at)}
          </span>
        </div>

        {/* steps */}
        <div className="flex-1 overflow-y-auto">
          {ex.error && (
            <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-xs font-mono">{ex.error}</p>
            </div>
          )}

          {(ex.steps || []).map((step, i) => {
            const ok = !step.error;
            return (
              <div key={i} className={`mx-4 mt-3 rounded-xl border overflow-hidden
                ${ok ? "border-white/[0.06]" : "border-red-500/25"}`}>
                {/* step header */}
                <div className={`flex items-center gap-2.5 px-3 py-2
                  ${ok ? "bg-white/[0.03]" : "bg-red-500/10"}`}>
                  <span className={`text-xs ${ok ? "text-green-400" : "text-red-400"}`}>
                    {ok ? "✓" : "✕"}
                  </span>
                  <span className="text-white/80 text-sm font-medium">{step.label}</span>
                  <span className="text-white/25 text-[10px] font-mono ml-auto">({step.type})</span>
                </div>

                {/* step body */}
                <div className="px-3 py-2 bg-black/20">
                  {step.error && (
                    <p className="text-red-400 text-xs font-mono">{step.error}</p>
                  )}
                  {!step.error && step.output && Object.keys(step.output).length > 0 && (
                    <pre className="text-white/50 text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  )}
                  {!step.error && (!step.output || Object.keys(step.output).length === 0) && (
                    <p className="text-white/20 text-xs italic">No output</p>
                  )}
                </div>
              </div>
            );
          })}

          {(!ex.steps || ex.steps.length === 0) && (
            <p className="text-white/25 text-xs px-4 py-4 italic">No step details.</p>
          )}

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export default function ExecutionsTab({ workflowId, lastResult }) {
  const [open,       setOpen]       = useState(false);
  const [executions, setExecutions] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [height,     setHeight]     = useState(256);   // px, default open height

  const load = useCallback(() => {
    if (!workflowId) return;
    setLoading(true);
    fetch(`${API}/workflows/${workflowId}/executions`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setExecutions(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workflowId]);

  useEffect(() => { if (lastResult) { load(); setOpen(true); } }, [lastResult]);
  useEffect(() => { if (open) load(); }, [open]);

  // ── Drag-to-resize ────────────────────────────────────────────────────
  const onDragStart = (e) => {
    e.preventDefault();
    const startY  = e.clientY;
    const startH  = height;

    const onMove = (mv) => {
      const delta = startY - mv.clientY;          // drag up = positive
      const next  = Math.min(600, Math.max(120, startH + delta));
      setHeight(next);
      if (next > 40) setOpen(true);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  return (
    <div
      style={{ height: open ? height : 44 }}
      className="border-t-2 border-white/20 bg-[#161616] flex flex-col shrink-0 relative"
    >
      {/* ── Drag handle ── */}
      <div
        onMouseDown={onDragStart}
        className="absolute -top-2 left-0 right-0 h-4 flex items-center justify-center
          cursor-ns-resize group z-10"
        title="Drag to resize"
      >
        <div className="w-16 h-1 rounded-full bg-white/20 group-hover:bg-white/50 transition-colors" />
      </div>

      {/* ── Tab bar ── */}
      <div className="h-11 flex items-center px-4 gap-3 shrink-0 bg-[#1a1a1a] border-b border-white/10">
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-left flex-1">
          {/* Icon */}
          <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
            Executions
          </span>
          {executions.length > 0 && (
            <span className="bg-white/15 text-white/70 text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10">
              {executions.length}
            </span>
          )}
          <span className="text-white/40 text-xs ml-1">{open ? "▾" : "▴"}</span>
        </button>

        {open && (
          <button onClick={load}
            className="text-white/40 hover:text-white/80 text-sm transition-colors px-1" title="Refresh">
            ↻
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {open && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-[#0d0d0d] z-10">
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-white/25 px-4 py-2 w-16">ID</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-white/25 px-4 py-2 w-28">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-white/25 px-4 py-2">Started At</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-white/25 px-4 py-2">Finished At</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-white/25 px-4 py-2 w-24">Duration</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-white/25 px-4 py-2 w-20">Steps</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-white/25 px-4 py-2 w-24">Details</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-white/25 text-xs italic">Loading…</td>
                </tr>
              )}

              {!loading && executions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-white/25 text-xs italic">
                    No executions yet. Hit Run to start one.
                  </td>
                </tr>
              )}

              {!loading && executions.map(ex => {
                const ok = ex.status === "completed";
                return (
                  <tr key={ex.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">

                    {/* ID */}
                    <td className="px-4 py-2.5 text-white/40 font-mono text-xs">#{ex.id}</td>

                    {/* Status */}
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                        px-2 py-0.5 rounded-full
                        ${ok
                          ? "bg-green-500/15 text-green-400"
                          : "bg-red-500/15 text-red-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-400" : "bg-red-400"}`} />
                        {ex.status}
                      </span>
                    </td>

                    {/* Started At */}
                    <td className="px-4 py-2.5 text-white/60 text-xs">{fmt(ex.started_at)}</td>

                    {/* Finished At */}
                    <td className="px-4 py-2.5 text-white/60 text-xs">{fmt(ex.finished_at)}</td>

                    {/* Duration */}
                    <td className="px-4 py-2.5 text-white/40 text-xs font-mono">
                      {duration(ex.started_at, ex.finished_at)}
                    </td>

                    {/* Steps */}
                    <td className="px-4 py-2.5 text-white/40 text-xs font-mono">
                      {ex.steps?.length ?? 0}
                    </td>

                    {/* View button */}
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setSelected(ex)}
                        className="text-xs text-white/40 hover:text-white/80 border border-white/10
                          hover:border-white/25 px-2.5 py-1 rounded-lg transition-colors">
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Step detail side drawer */}
      {selected && (
        <StepDrawer ex={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
