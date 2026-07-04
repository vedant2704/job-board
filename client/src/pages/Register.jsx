import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import api from '../lib/api.js'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate', company_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role }
      if (form.role === 'employer') payload.company_name = form.company_name
      const { data } = await api.post('/api/auth/register', payload)
      setAuth(data.user, data.token)
      navigate(data.user.role === 'candidate' ? '/resume' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Find your perfect match</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

          {/* Role toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1 mb-5">
            {['candidate', 'employer'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: r }))}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors capitalize
                  ${form.role === r ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>

            {form.role === 'employer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
                <input type="text" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Acme Corp" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-violet-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
