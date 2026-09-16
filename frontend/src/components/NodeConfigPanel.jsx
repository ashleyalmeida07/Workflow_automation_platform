/*
  NodeConfigPanel.jsx
  - Horizontally resizable via a drag handle on the left edge
  - JSON / textarea fields styled like a VS Code dark editor
*/
import { useEffect, useRef, useState, useCallback } from "react";

const ACCENT = {
  orange: "border-orange-500/50 text-orange-300",
  blue:   "border-blue-500/50   text-blue-300",
  yellow: "border-yellow-500/50 text-yellow-300",
  green:  "border-green-500/50  text-green-300",
  purple: "border-purple-500/50 text-purple-300",
  gray:   "border-gray-500/50   text-gray-300",
  indigo: "border-indigo-500/50 text-indigo-300",
  teal:   "border-teal-500/50   text-teal-300",
};

const LABEL = "text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5 block";
const INPUT_BASE =
  "w-full bg-[#141414] border border-white/[0.08] text-white/90 text-sm rounded-xl px-3 py-2 outline-none " +
  "focus:border-white/25 transition-colors placeholder:text-white/20";

function CodeField({ label, language, value, onChange, rows }) {
  const [copied, setCopied] = useState(false);
  language = language || "json";
  rows = rows || 5;

  const handleCopy = () => {
    navigator.clipboard.writeText(value || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const langColor =
    language === "json"   ? "text-yellow-400/80" :
    language === "python" ? "text-blue-400/80"   : "text-white/40";

  const lineCount = (value || " ").split("\n").length;

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0d1117]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-white/[0.06]">
          <span className={"text-[10px] font-bold uppercase tracking-widest " + langColor}>{language}</span>
          <button onClick={handleCopy} className="flex items-center gap-1 text-white/30 hover:text-white/70 transition-colors text-[10px]">
            {copied
              ? <span className="text-green-400 flex items-center gap-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>Copied</span>
              : <span className="flex items-center gap-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</span>
            }
          </button>
        </div>
        <div className="flex" style={{fontFamily:"'JetBrains Mono','Fira Code',monospace"}}>
          <div className="select-none text-right pr-2.5 pl-2.5 py-3 text-[#4d5566] text-[11px] leading-6 bg-[#0d1117] border-r border-white/[0.05] shrink-0" style={{minWidth:"2.4rem"}}>
            {Array.from({length: lineCount}, (_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <textarea
            rows={rows}
            value={value != null ? value : ""}
            onChange={e => onChange(e.target.value)}
            spellCheck={false}
            className="flex-1 min-w-0 bg-[#0d1117] text-[#e6edf3] text-[12px] leading-6 py-3 px-3 outline-none resize-y placeholder:text-white/20"
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, def, value, onChange }) {
  const val = value != null ? value : (def && def.default != null ? def.default : "");
  if (def && def.type === "select") {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <select value={val} onChange={e => onChange(e.target.value)} className={INPUT_BASE + " cursor-pointer"}>
          {(def.options || []).map(opt => <option key={opt} value={opt} className="bg-[#141414]">{opt}</option>)}
        </select>
      </div>
    );
  }
  if (def && def.type === "textarea") return <CodeField label={label} language="python" value={val} onChange={onChange} rows={7} />;
  if (def && def.type === "json")     return <CodeField label={label} language="json"   value={val} onChange={onChange} rows={5} />;
  if (def && def.type === "number") {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <input type="number" min={0} value={val} onChange={e => onChange(e.target.value)} placeholder={(def && def.default) || "0"} className={INPUT_BASE} />
      </div>
    );
  }
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input type="text" value={val} onChange={e => onChange(e.target.value)} placeholder={(def && def.default) || ""} className={INPUT_BASE} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-white/25 text-[10px] font-bold uppercase tracking-widest w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-white/55 text-xs leading-relaxed font-mono">{value}</span>
    </div>
  );
}

const MIN_W = 280;
const MAX_W = 680;
const DEF_W = 340;

export default function NodeConfigPanel({ node, nodeTypes, onUpdate, onClose }) {
  if (!node) return null;

  const engineType = node.data && node.data.engine_type;
  const typeDef    = (nodeTypes && nodeTypes[engineType]) || {};
  const settings   = typeDef.settings || {};
  const color      = (node.data && node.data.color) || "blue";
  const accent     = ACCENT[color] || ACCENT.blue;

  const [label,  setLabel]  = useState((node.data && node.data.label)    || "");
  const [values, setValues] = useState((node.data && node.data.settings) || {});
  const [width,  setWidth]  = useState(DEF_W);

  useEffect(() => {
    setLabel((node.data && node.data.label)    || "");
    setValues((node.data && node.data.settings) || {});
  }, [node.id]);

  const handleLabelChange   = val => { setLabel(val); onUpdate(node.id, values, val); };
  const handleSettingChange = (key, val) => {
    const next = Object.assign({}, values, {[key]: val});
    setValues(next);
    onUpdate(node.id, next, label);
  };
  const hasSettings = Object.keys(settings).length > 0;

  const startXRef = useRef(0);
  const startWRef = useRef(DEF_W);
  const onDragStart = useCallback(function(e) {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWRef.current = width;
    function onMove(ev) {
      setWidth(function(w) { return Math.min(MAX_W, Math.max(MIN_W, startWRef.current + (startXRef.current - ev.clientX))); });
    }
    function onUp() { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, [width]);

  const BODYLESS      = ["GET","HEAD","DELETE","OPTIONS","TRACE"];
  const currentMethod = ((values["method"] || "GET")).toUpperCase();

  return (
    <aside className="relative bg-[#0c0c0c] border-l border-white/[0.06] flex flex-col h-full shrink-0 overflow-hidden" style={{width: width}}>
      <div onMouseDown={onDragStart} className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-50 hover:bg-white/[0.06] transition-colors group" title="Drag to resize">
        <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-10 rounded-full bg-white/0 group-hover:bg-white/40 transition-all duration-200" />
      </div>

      <div className={"px-5 py-4 border-b border-white/[0.06] border-l-2 ml-2 " + accent}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">{engineType && engineType.replace(/_/g," ")}</p>
            <h2 className="text-white font-semibold text-sm truncate">{label || (node.data && node.data.label)}</h2>
            <p className="text-white/35 text-xs mt-1 leading-relaxed">{typeDef.description}</p>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/70 transition-colors text-xl leading-none shrink-0 mt-0.5" title="Close">&times;</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 ml-2 scrollbar-hide">
        <section>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-3">Node Info</p>
          <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2.5">
            <div>
              <label className={LABEL}>Node Name</label>
              <input type="text" value={label} onChange={e => handleLabelChange(e.target.value)} placeholder="e.g. Fetch User Data" className={INPUT_BASE} />
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <InfoRow label="Type"    value={engineType} />
              <InfoRow label="Node ID" value={node.id}    />
              {typeDef.inputs  && typeDef.inputs.length  > 0 && <InfoRow label="Inputs"  value={typeDef.inputs.join(", ")}  />}
              {typeDef.outputs && typeDef.outputs.length > 0 && <InfoRow label="Outputs" value={typeDef.outputs.join(", ")} />}
            </div>
          </div>
        </section>

        {hasSettings && (
          <section>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-3">Configuration</p>
            <div className="flex flex-col gap-4">
              {Object.entries(settings).map(function([key, def]) {
                if (key === "body" && engineType === "http_request" && BODYLESS.indexOf(currentMethod) >= 0) {
                  return (
                    <div key={key}>
                      <label className={LABEL}>Body (JSON)</label>
                      <div className="w-full bg-white/[0.02] border border-white/[0.05] text-white/20 text-xs rounded-xl px-3 py-2 italic">Not applicable for {currentMethod} requests</div>
                    </div>
                  );
                }
                return <Field key={key} label={def.label} def={def} value={values[key]} onChange={function(val){ handleSettingChange(key, val); }} />;
              })}
            </div>
          </section>
        )}

        {!hasSettings && (
          <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-white/25 text-xs">This node has no configurable settings.</p>
          </div>
        )}

        {engineType === "http_request" && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300/70 leading-relaxed">
            <strong className="text-blue-300/90 block mb-1">Tip</strong>
            Outputs <code className="font-mono">status_code</code> and <code className="font-mono">response</code>. Use <code className="font-mono">{"{{status_code}}"}</code> in Logger.
          </div>
        )}
        {engineType === "python_function" && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300/70 leading-relaxed">
            <strong className="text-indigo-300/90 block mb-1">Available variables</strong>
            <code className="font-mono">state</code> — previous outputs<br/>
            <code className="font-mono">result</code> — write your outputs here
          </div>
        )}
        {engineType === "condition" && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300/70 leading-relaxed">
            <strong className="text-yellow-300/90 block mb-1">Branching</strong>
            <span className="text-green-400 font-semibold">T</span> = true path, <span className="text-red-400 font-semibold">F</span> = false path.
          </div>
        )}
        {engineType === "logger" && (
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-3 text-xs text-teal-300/70 leading-relaxed">
            <strong className="text-teal-300/90 block mb-1">Placeholders</strong>
            Use <code className="font-mono">{"{{status_code}}"}</code>, <code className="font-mono">{"{{response}}"}</code> to print state values.
          </div>
        )}
      </div>
    </aside>
  );
}
