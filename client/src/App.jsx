import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const Placeholder = ({ name }) => (
  <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
    {name} — coming soon
  </div>
)

const Home = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
          </svg>
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">JobMatch</h1>
        <p className="text-gray-500 mb-8">AI-powered job matching — upload your resume, find your role</p>
        <div className="flex gap-3 justify-center">
          <a href="/register" className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">Get started</a>
          <a href="/login" className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Sign in</a>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Placeholder name="Login" />} />
        <Route path="/register" element={<Placeholder name="Register" />} />
        <Route path="/dashboard" element={<ProtectedRoute><Placeholder name="Dashboard" /></ProtectedRoute>} />
        <Route path="/jobs" element={<Placeholder name="Job listings" />} />
        <Route path="/jobs/:id" element={<Placeholder name="Job detail" />} />
        <Route path="/resume" element={<ProtectedRoute role="candidate"><Placeholder name="Resume upload" /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute role="candidate"><Placeholder name="AI matches" /></ProtectedRoute>} />
        <Route path="/post-job" element={<ProtectedRoute role="employer"><Placeholder name="Post job" /></ProtectedRoute>} />
        <Route path="/applicants/:jobId" element={<ProtectedRoute role="employer"><Placeholder name="Applicants" /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
