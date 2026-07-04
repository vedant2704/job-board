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

export default function Applicants() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [applicants, setApplicants] = useState([])
  const [jobTitle, setJobTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/api/jobs/${jobId}/applicants`),
      api.get(`/api/jobs/${jobId}`),
    ]).then(([appsRes, jobRes]) => {
      setApplicants(appsRes.data.applicants)
      setJobTitle(jobRes.data.title)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [jobId])

  const updateStatus = async (appId, status) => {
    try {
      await api.patch(`/api/jobs/${jobId}/applicants/${appId}?status=${status}`)
      setApplicants((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a))
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to dashboard
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Applicants</h1>
            <p className="text-sm text-gray-500 mt-0.5">{jobTitle}</p>
          </div>
          <span className="text-sm text-gray-400">{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No applicants yet</div>
        ) : (
          <div className="space-y-3">
            {applicants.map((app) => (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold flex-shrink-0">
                  {app.candidate?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{app.candidate?.name}</p>
                  <p className="text-xs text-gray-400">{app.candidate?.email}</p>
                </div>

                {app.match_score != null && (
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${app.match_score > 0.8 ? 'text-emerald-600' : app.match_score > 0.6 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {Math.round(app.match_score * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">match</div>
                  </div>
                )}

                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[app.status]}`}>
                  {app.status}
                </span>

                <div className="flex gap-2">
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
