import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'

const TYPE_LABELS = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', remote: 'Remote', internship: 'Internship' }

function ScoreBadge({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : pct >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-gray-500 bg-gray-50 border-gray-200'
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${color} min-w-[64px]`}>
      <span className="text-lg font-bold leading-none">{pct}%</span>
      <span className="text-xs mt-0.5 font-medium">match</span>
    </div>
  )
}

function MatchCard({ job, onApply }) {
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(job.already_applied)
  const navigate = useNavigate()

  const handleApply = async (e) => {
    e.stopPropagation()
    setApplying(true)
    try {
      await api.post(`/api/jobs/${job.id}/apply`)
      setApplied(true)
      onApply?.(job.id)
    } catch (err) {
      if (err.response?.status === 409) setApplied(true)
    } finally { setApplying(false) }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-violet-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <ScoreBadge score={job.match_score} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <button onClick={() => navigate(`/jobs/${job.id}`)}
              className="text-sm font-semibold text-gray-900 hover:text-violet-700 transition-colors text-left">
              {job.title}
            </button>
            <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
              {TYPE_LABELS[job.job_type] || job.job_type}
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-2">{job.company} · {job.location}</p>

          {job.salary_min && job.salary_max && (
            <p className="text-xs font-medium text-emerald-600 mb-2">
              ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}/yr
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.skills_required?.slice(0, 5).map((s) => (
              <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{s}</span>
            ))}
            {job.skills_required?.length > 5 && (
              <span className="text-xs text-gray-400">+{job.skills_required.length - 5} more</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 line-clamp-1 flex-1 mr-4">{job.description}</p>
            {applied ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium whitespace-nowrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Applied
              </span>
            ) : (
              <button onClick={handleApply} disabled={applying}
                className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 whitespace-nowrap">
                {applying ? 'Applying…' : 'Quick apply'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AIMatches() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    api.get('/api/resume/matches')
      .then(({ data }) => {
        setMatches(data.matches)
        setSkills(data.resume_skills || [])
      })
      .catch((err) => {
        if (err.response?.status === 404) setError('no_resume')
        else if (err.response?.status === 202) setProcessing(true)
        else setError('Failed to load matches')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-white border border-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )

  if (error === 'no_resume') return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload your resume first</h2>
        <p className="text-sm text-gray-500 mb-6">We need your resume to find the best matching jobs for you</p>
        <button onClick={() => navigate('/resume')}
          className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
          Upload resume
        </button>
      </div>
    </div>
  )

  if (processing) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing your resume…</h2>
        <p className="text-sm text-gray-500">We're extracting your skills and finding matches. This takes about 10 seconds.</p>
        <button onClick={() => window.location.reload()} className="mt-6 text-sm text-violet-600 hover:underline">Refresh</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your AI matches</h1>
            <p className="text-sm text-gray-500 mt-1">{matches.length} jobs ranked by how well they match your resume</p>
          </div>
          <button onClick={() => navigate('/resume')}
            className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            Update resume
          </button>
        </div>

        {/* Your skills */}
        {skills.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Your extracted skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Score legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full" />80%+ strong match</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" />60–79% good match</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full" />below 60% weak match</span>
        </div>

        {/* Match cards */}
        {matches.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No matches found yet — more jobs will be matched as employers post listings
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((job) => (
              <MatchCard
                key={job.id}
                job={job}
                onApply={(id) => setMatches((prev) => prev.map((j) => j.id === id ? { ...j, already_applied: true } : j))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
