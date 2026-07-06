import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  reviewed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
}

function ScoreBar({ score }) {
  const pct = Math.round((score ?? 0) * 100)
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-gray-300'
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-8 text-right ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-gray-400'}`}>
        {score != null ? `${pct}%` : '—'}
      </span>
    </div>
  )
}

export default function Applicants() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get(`/api/jobs/${jobId}/applicants`)
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [jobId])

  const updateStatus = async (appId, status) => {
    try {
      await api.patch(`/api/jobs/${jobId}/applicants/${appId}?status=${status}`)
      setData((prev) => ({
        ...prev,
        applicants: prev.applicants.map((a) => a.id === appId ? { ...a, status } : a),
      }))
    } catch (err) { console.error(err) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  const job = data?.job
  const applicants = data?.applicants || []

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to dashboard
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{job?.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{job?.location} · {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</p>
          </div>
          {applicants.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Sorted by AI match score</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" />80%+</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" />60–79%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full" />below 60%</span>
              </div>
            </div>
          )}
        </div>

        {applicants.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
            <p className="text-gray-400 text-sm">No applicants yet</p>
            <p className="text-gray-300 text-xs mt-1">Share the job link to get more applicants</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applicants.map((app, idx) => (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Rank + avatar */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-300 font-mono w-4">#{idx + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">
                      {app.candidate?.name?.[0]?.toUpperCase()}
                    </div>
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{app.candidate?.name}</p>
                    <p className="text-xs text-gray-400">{app.candidate?.email}</p>
                  </div>

                  {/* AI match score bar */}
                  <ScoreBar score={app.match_score} />

                  {/* Status badge */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize flex-shrink-0 ${STATUS_COLORS[app.status]}`}>
                    {app.status}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                      className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {expanded === app.id ? 'Hide' : 'Details'}
                    </button>
                    <button onClick={() => updateStatus(app.id, 'accepted')}
                      className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                      Accept
                    </button>
                    <button onClick={() => updateStatus(app.id, 'rejected')}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>

                {/* Expanded details — skills comparison */}
                {expanded === app.id && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Candidate skills */}
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Candidate skills</p>
                        {app.candidate?.skills?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {app.candidate.skills.map((s) => {
                              const isMatch = job?.skills_required?.some(
                                (r) => r.toLowerCase() === s.toLowerCase()
                              )
                              return (
                                <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium
                                  ${isMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {s} {isMatch && '✓'}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-300">No skills extracted yet</p>
                        )}
                      </div>

                      {/* Required skills */}
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Required for this role</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job?.skills_required?.map((s) => {
                            const hasSkill = app.candidate?.skills?.some(
                              (cs) => cs.toLowerCase() === s.toLowerCase()
                            )
                            return (
                              <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium
                                ${hasSkill ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                                {s} {hasSkill ? '✓' : '✗'}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Applied at + resume */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-400">
                        Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      {app.candidate?.resume_filename && (
                        <p className="text-xs text-gray-400">📄 {app.candidate.resume_filename}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
