/* NodeConfigPanel.jsx
   A side-panel that opens when a node is selected.
   It reads the node's settings definition from the backend /node-types endpoint
   and renders the right input for each field.
*/

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

import { useEffect, useState } from 'react'

export default function NodeConfigPanel({ node, nodeTypes, onUpdate, onClose }) {
  if (!node) return null

  const engineType = node.data?.engine_type
  const typeDef    = nodeTypes?.[engineType]
  const settings   = typeDef?.settings || {}
  const hasSettings = Object.keys(settings).length > 0

  // local copy of this node's settings values
  const [values, setValues] = useState(node.data?.settings || {})

  // reset when a different node is selected
  useEffect(() => {
    setValues(node.data?.settings || {})
  }, [node.id])

  const handleChange = (key, val) => {
    const next = { ...values, [key]: val }
    setValues(next)
    // push update to the parent (Flow.jsx) immediately
    onUpdate(node.id, next)
  }

  return (
    <div className="w-72 bg-[#111] border-l border-white/[0.06] flex flex-col h-full overflow-y-auto shrink-0">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div>
          <div className="text-white font-semibold text-sm">{node.data?.label}</div>
          <div className="text-white/40 text-xs mt-0.5">{typeDef?.description || engineType}</div>
        </div>
        <button onClick={onClose}
          className="text-white/40 hover:text-white/80 text-lg leading-none">✕</button>
      </div>

      {/* settings fields */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-4">
        {!hasSettings && (
          <p className="text-white/30 text-xs italic">No settings for this node type.</p>
        )}

        {Object.entries(settings).map(([key, def]) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-white/50 text-xs font-medium">{def.label}</label>

            {def.type === 'select' ? (
              <select
                value={values[key] ?? def.default}
                onChange={e => handleChange(key, e.target.value)}
                className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-blue-500/60"
              >
                {(def.options || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : def.type === 'json' ? (
              <textarea
                rows={3}
                value={values[key] ?? def.default}
                onChange={e => handleChange(key, e.target.value)}
                placeholder={def.default || '{}'}
                className="bg-white/5 border border-white/10 text-white text-xs font-mono rounded-lg px-3 py-2 outline-none focus:border-blue-500/60 resize-none"
              />
            ) : (
              <input
                type="text"
                value={values[key] ?? def.default}
                onChange={e => handleChange(key, e.target.value)}
                placeholder={def.default || ''}
                className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-blue-500/60"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
