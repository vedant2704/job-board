import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import api from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'

const TYPE_LABELS = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', remote: 'Remote', internship: 'Internship' }
const STATUS_COLORS = { active: 'bg-emerald-50 text-emerald-700', closed: 'bg-gray-100 text-gray-500' }

// ── Employer Dashboard ────────────────────────────────────────────────────────
function EmployerDashboard({ user }) {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/jobs/employer/my-jobs')
      .then(({ data }) => setJobs(data.jobs))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const closeJob = async (jobId) => {
    if (!window.confirm('Close this job listing?')) return
    try {
      await api.delete(`/api/jobs/${jobId}`)
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: 'closed' } : j))
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your job listings</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user?.company_name} · {jobs.length} listing{jobs.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => navigate('/post-job')}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Post a job
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white border border-gray-200 rounded-xl animate-pulse" />)}</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">No job listings yet</p>
            <button onClick={() => navigate('/post-job')} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700">
              Post your first job
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{job.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status]}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{job.location} · {TYPE_LABELS[job.job_type]}</p>
                </div>

                {/* Applicant count */}
                <button
                  onClick={() => navigate(`/applicants/${job.id}`)}
                  className="flex flex-col items-center px-4 py-2 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                >
                  <span className="text-lg font-bold text-violet-700">{job.applicant_count ?? 0}</span>
                  <span className="text-xs text-violet-500">applicant{job.applicant_count !== 1 ? 's' : ''}</span>
                </button>

                <div className="flex gap-2">
                  <button onClick={() => navigate(`/applicants/${job.id}`)}
                    className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    View applicants
                  </button>
                  {job.status === 'active' && (
                    <button onClick={() => closeJob(job.id)}
                      className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      Close
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Candidate Dashboard ───────────────────────────────────────────────────────
function CandidateDashboard({ user }) {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)

  const STATUS_STYLES = {
    pending: 'bg-gray-100 text-gray-600',
    reviewed: 'bg-blue-100 text-blue-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-600',
  }

  useEffect(() => {
    Promise.all([
      api.get('/api/jobs/candidate/my-applications'),
      api.get('/api/resume/me'),
    ]).then(([appsRes, resumeRes]) => {
      setApplications(appsRes.data.applications)
      setResume(resumeRes.data.resume)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your applications and AI job matches</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <button onClick={() => navigate('/resume')}
            className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-violet-300 transition-all group">
            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-violet-200 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">{resume ? 'Update resume' : 'Upload resume'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{resume ? resume.filename : 'PDF, max 5MB'}</p>
          </button>

          <button onClick={() => navigate('/matches')}
            className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-violet-300 transition-all group">
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-200 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">AI job matches</p>
            <p className="text-xs text-gray-400 mt-0.5">Ranked by your resume</p>
          </button>

          <button onClick={() => navigate('/jobs')}
            className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-violet-300 transition-all group">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Browse all jobs</p>
            <p className="text-xs text-gray-400 mt-0.5">Search by title or location</p>
          </button>
        </div>

        {/* Applications */}
        <h2 className="text-base font-semibold text-gray-900 mb-4">Your applications</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />)}</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white border border-gray-200 rounded-xl">
            No applications yet — <button onClick={() => navigate('/jobs')} className="text-violet-600 hover:underline">browse jobs</button>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{app.job?.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{app.job?.company} · {app.job?.location}</p>
                </div>
                {app.match_score != null && (
                  <div className={`text-sm font-semibold ${app.match_score > 0.8 ? 'text-emerald-600' : app.match_score > 0.6 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {Math.round(app.match_score * 100)}% match
                  </div>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[app.status]}`}>
                  {app.status}
                </span>
                <span className="text-xs text-gray-300">
                  {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  if (user?.role === 'employer') return <EmployerDashboard user={user} />
  return <CandidateDashboard user={user} />
}
