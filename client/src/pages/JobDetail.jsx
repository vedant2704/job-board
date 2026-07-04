import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'
import { useAuthStore } from '../store/authStore.js'

const TYPE_LABELS = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', remote: 'Remote', internship: 'Internship' }

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    api.get(`/api/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch(() => setLoadError('Job not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleApply = async () => {
    if (!isAuthenticated()) { navigate('/login'); return }
    setApplying(true)
    setApplyError('')
    try {
      await api.post(`/api/jobs/${id}/apply`)
      setApplied(true)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to apply'
      if (detail.toLowerCase().includes('already applied')) {
        setApplied(true) // already applied — treat same as success state
      } else {
        setApplyError(detail)
      }
    } finally { setApplying(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (loadError || !job) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="text-center py-32 text-gray-400">{loadError || 'Job not found'}
        <br /><button onClick={() => navigate('/jobs')} className="mt-4 text-violet-600 text-sm hover:underline">← Back to listings</button>
      </div>
    </div>
  )

  const isCandidate = user?.role === 'candidate'

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/jobs')} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to listings
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">{job.title}</h1>
              <p className="text-gray-500">{job.company} · {job.location}</p>
            </div>
            <span className="text-sm bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full whitespace-nowrap">
              {TYPE_LABELS[job.job_type]}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500">
            {job.salary_min && job.salary_max && (
              <span className="text-emerald-600 font-medium">
                ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}/yr
              </span>
            )}
            {job.experience_years > 0 && <span>{job.experience_years}+ years experience</span>}
            <span>Posted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {/* Skills */}
          {job.skills_required?.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Required skills</p>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((s) => (
                  <span key={s} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">{s}</span>
                ))}
              </div>
            </div>
          )}

          <hr className="border-gray-100 mb-6" />

          {/* Description */}
          <div className="mb-8">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">About this role</p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Apply button */}
          {isCandidate && (
            <div>
              {applyError && <p className="text-sm text-red-500 mb-3">{applyError}</p>}
              {applied ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  You've applied to this job
                </div>
              ) : (
                <button onClick={handleApply} disabled={applying}
                  className="px-6 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60">
                  {applying ? 'Applying…' : 'Apply for this role'}
                </button>
              )}
            </div>
          )}

          {!isAuthenticated() && (
            <button onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors">
              Sign in to apply
            </button>
          )}
        </div>
      </div>
    </div>
  )
}