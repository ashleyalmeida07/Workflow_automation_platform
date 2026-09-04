/*
  NodeConfigPanel.jsx
  Opens when a node is selected. Shows:
    - Node Name (editable)
    - Description (read-only from node type)
    - All settings fields specific to this node type
  Every change immediately updates the workflow JSON via onUpdate().
*/

import { useEffect, useState } from "react";

// Color accent per node type
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

const INPUT_BASE =
  "w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none " +
  "focus:border-white/30 transition-colors placeholder:text-white/20";

const LABEL = "text-white/40 text-[11px] font-semibold uppercase tracking-wider mb-1 block";

// ── Generic field renderer ─────────────────────────────────────────────────
function Field({ label, def, value, onChange }) {
  const val = value ?? def?.default ?? "";

  if (def?.type === "select") {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <select
          value={val}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_BASE + " cursor-pointer"}
        >
          {(def.options || []).map((opt) => (
            <option key={opt} value={opt} className="bg-[#1a1a1a]">
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (def?.type === "textarea" || def?.type === "json") {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <textarea
          rows={def.type === "textarea" ? 6 : 4}
          value={val}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def?.default || ""}
          className={INPUT_BASE + " font-mono text-xs resize-y"}
          spellCheck={false}
        />
      </div>
    );
  }

  if (def?.type === "number") {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <input
          type="number"
          min={0}
          value={val}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def?.default || "0"}
          className={INPUT_BASE}
        />
      </div>
    );
  }

  // default: text
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input
        type="text"
        value={val}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def?.default || ""}
        className={INPUT_BASE}
      />
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-white/30 text-[11px] font-semibold uppercase tracking-wider w-20 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-white/60 text-xs leading-relaxed">{value}</span>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────
export default function NodeConfigPanel({ node, nodeTypes, onUpdate, onClose }) {
  if (!node) return null;

  const engineType = node.data?.engine_type;
  const typeDef    = nodeTypes?.[engineType] || {};
  const settings   = typeDef.settings || {};
  const color      = node.data?.color || "blue";
  const accent     = ACCENT[color] || ACCENT.blue;

  // Local editable state
  const [label,  setLabel]  = useState(node.data?.label  || "");
  const [values, setValues] = useState(node.data?.settings || {});

  // Reset when a different node is selected
  useEffect(() => {
    setLabel(node.data?.label    || "");
    setValues(node.data?.settings || {});
  }, [node.id]);

  // Push label change up immediately
  const handleLabelChange = (val) => {
    setLabel(val);
    onUpdate(node.id, values, val); // pass new label too
  };

  // Push settings change up immediately
  const handleSettingChange = (key, val) => {
    const next = { ...values, [key]: val };
    setValues(next);
    onUpdate(node.id, next, label);
  };

  const hasSettings = Object.keys(settings).length > 0;

  return (
    <aside className="w-80 bg-[#0f0f0f] border-l border-white/[0.06] flex flex-col h-full shrink-0">

      {/* ── Header ── */}
      <div className={`px-4 py-4 border-b border-white/[0.06] border-l-2 ${accent}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-1">
              {engineType?.replace("_", " ")}
            </p>
            <h2 className="text-white font-semibold text-sm truncate">{label || node.data?.label}</h2>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">{typeDef.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none shrink-0 mt-0.5"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

        {/* Node Info section */}
        <section>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-3">
            Node Info
          </p>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2.5">

            {/* Editable name */}
            <div>
              <label className={LABEL}>Node Name</label>
              <input
                type="text"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g. Fetch User Data"
                className={INPUT_BASE}
              />
            </div>

            {/* Read-only info */}
            <div className="flex flex-col gap-1.5 mt-1">
              <InfoRow label="Type"    value={engineType} />
              <InfoRow label="Node ID" value={node.id}    />
              {typeDef.inputs?.length  > 0 && <InfoRow label="Inputs"  value={typeDef.inputs.join(", ")}  />}
              {typeDef.outputs?.length > 0 && <InfoRow label="Outputs" value={typeDef.outputs.join(", ")} />}
            </div>
          </div>
        </section>

        {/* Settings section */}
        {hasSettings && (
          <section>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-3">
              Configuration
            </p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-4">
              {Object.entries(settings).map(([key, def]) => (
                <Field
                  key={key}
                  label={def.label}
                  def={def}
                  value={values[key]}
                  onChange={(val) => handleSettingChange(key, val)}
                />
              ))}
            </div>
          </section>
        )}

        {/* No settings */}
        {!hasSettings && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-white/25 text-xs">This node has no configurable settings.</p>
          </div>
        )}

        {/* Placeholder tips per node type */}
        {engineType === "http_request" && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300/70 leading-relaxed">
            <strong className="text-blue-300/90 block mb-1">Tip</strong>
            Outputs <code className="font-mono">status_code</code> and <code className="font-mono">response</code> into state. Use these in a Logger: <code className="font-mono">{"{{status_code}}"}</code>
          </div>
        )}
        {engineType === "python_function" && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300/70 leading-relaxed">
            <strong className="text-indigo-300/90 block mb-1">Available variables</strong>
            <code className="font-mono">state</code> — all previous node outputs<br />
            <code className="font-mono">result</code> — write your outputs here<br />
            <code className="font-mono text-white/30">result["x"] = state.get("status_code")</code>
          </div>
        )}
        {engineType === "condition" && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300/70 leading-relaxed">
            <strong className="text-yellow-300/90 block mb-1">Branching</strong>
            Connect the <span className="text-green-400 font-semibold">T</span> handle for the true path, <span className="text-red-400 font-semibold">F</span> for the false path.
          </div>
        )}
        {engineType === "logger" && (
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-3 text-xs text-teal-300/70 leading-relaxed">
            <strong className="text-teal-300/90 block mb-1">Placeholders</strong>
            Use <code className="font-mono">{"{{status_code}}"}</code>, <code className="font-mono">{"{{response}}"}</code> etc. to print state values. Output appears in the uvicorn terminal.
          </div>
        )}

      </div>
    </aside>
  );
}
