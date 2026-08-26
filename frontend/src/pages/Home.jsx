import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          FlowForge
        </h1>
        <p className="text-gray-400 mb-8">
          Automate anything. Build powerful workflows visually, no code required.
        </p>
        <Link
          to="/flow"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
        >
          Open Flow Editor
        </Link>
      </div>
    </div>
  )
}
