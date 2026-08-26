import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetch(`${API}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token')
          navigate('/login')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) setUser(data)
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user?.name}</h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-gray-800 rounded-xl divide-y divide-gray-700">
          <div className="flex justify-between px-4 py-3">
            <span className="text-gray-400 text-sm">User ID</span>
            <span className="text-white text-sm font-mono">#{user?.id}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-gray-400 text-sm">Name</span>
            <span className="text-white text-sm">{user?.name}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-gray-400 text-sm">Email</span>
            <span className="text-white text-sm">{user?.email}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Link
            to="/"
            className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg py-2.5 transition"
          >
            ← Home
          </Link>
          <button
            id="logout-btn"
            onClick={logout}
            className="flex-1 bg-red-900/60 hover:bg-red-800 text-red-300 text-sm font-medium rounded-lg py-2.5 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
