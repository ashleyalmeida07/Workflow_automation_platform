/* ExecutionResultPanel.jsx
   Shows the step-by-step result of the last workflow run.
*/

export default function ExecutionResultPanel({ result, onClose }) {
  if (!result) return null

  const statusColor = result.status === 'completed'
    ? 'text-green-400'
    : 'text-red-400'

  return (
    <div className="absolute bottom-4 right-4 w-[380px] bg-[#141414] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col max-h-[60vh]">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${statusColor}`}>
            {result.status === 'completed' ? '✓ Run completed' : '✕ Run failed'}
          </span>
          <span className="text-white/30 text-xs">{result.steps?.length} steps</span>
        </div>
        <button onClick={onClose}
          className="text-white/40 hover:text-white/80 text-lg leading-none">✕</button>
      </div>

      {/* steps */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {result.steps?.map((step, i) => (
          <div key={i}
            className={`rounded-xl border px-3 py-2 text-xs
              ${step.error
                ? 'bg-red-500/10 border-red-500/20 text-red-300'
                : 'bg-white/5 border-white/10 text-white/70'
              }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${step.error ? 'text-red-400' : 'text-white/90'}`}>
                {step.label}
              </span>
              <span className="opacity-50">({step.type})</span>
              {step.error && <span className="ml-auto text-red-400">✕</span>}
              {!step.error && <span className="ml-auto text-green-400">✓</span>}
            </div>

            {step.error && (
              <div className="font-mono text-red-300 mt-1">{step.error}</div>
            )}

            {!step.error && Object.keys(step.output || {}).length > 0 && (
              <pre className="font-mono text-white/50 whitespace-pre-wrap mt-1 break-all">
                {JSON.stringify(step.output, null, 2)}
              </pre>
            )}
          </div>
        ))}

        {result.error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">
            {result.error}
          </div>
        )}
      </div>
    </div>
  )
}
