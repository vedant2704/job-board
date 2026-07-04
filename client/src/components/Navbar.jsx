import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuthStore()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
        </div>
        <span className="font-semibold text-gray-900 text-sm">JobMatch</span>
      </Link>

      <nav className="flex items-center gap-4">
        <Link to="/jobs" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Browse jobs</Link>

        {isAuthenticated() ? (
          <>
            {user?.role === 'employer' && (
              <Link to="/post-job" className="text-sm text-gray-500 hover:text-gray-800">Post a job</Link>
            )}
            {user?.role === 'candidate' && (
              <Link to="/matches" className="text-sm text-gray-500 hover:text-gray-800">My matches</Link>
            )}
            <Link to="/dashboard">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </Link>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-800">Sign in</Link>
            <Link to="/register" className="px-3 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
