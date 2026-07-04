import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import api from '../lib/api.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const isEmployer = user?.role === 'employer'

  const [myJobs, setMyJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(isEmployer)

  useEffect(() => {
    if (!isEmployer) return
    api.get('/api/jobs/employer/my-jobs')
      .then(({ data }) => setMyJobs(data.jobs))
      .catch(console.error)
      .finally(() => setLoadingJobs(false))
  }, [isEmployer])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">JobMatch</span>
        </div>
        <div className="flex items-center gap-4">
          {isEmployer ? (
            <button onClick={() => navigate('/post-job')}
              className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors">
              + Post a job
            </button>
          ) : (
            <button onClick={() => navigate('/matches')}
              className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors">
              View matches
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome, {user?.name} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{user?.role} account
            {isEmployer && user?.company_name && ` · ${user.company_name}`}
          </p>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {isEmployer ? (
            <>
              <ActionCard
                icon="📋" title="Post a Job"
                desc="Create a new job listing for candidates to find"
                onClick={() => navigate('/post-job')}
                color="violet"
              />
              <ActionCard
                icon="👥" title="Browse Jobs"
                desc="View all public job listings"
                onClick={() => navigate('/jobs')}
                color="blue"
              />
            </>
          ) : (
            <>
              <ActionCard
                icon="📄" title="Upload Resume"
                desc="Upload your PDF resume to enable AI job matching"
                onClick={() => navigate('/resume')}
                color="violet"
              />
              <ActionCard
                icon="✨" title="AI Job Matches"
                desc="See jobs ranked by how well they match your profile"
                onClick={() => navigate('/matches')}
                color="emerald"
              />
              <ActionCard
                icon="🔍" title="Browse All Jobs"
                desc="Search and filter all available job listings"
                onClick={() => navigate('/jobs')}
                color="blue"
              />
            </>
          )}
        </div>

        {/* Employer: list of posted jobs with applicant links */}
        {isEmployer && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Your posted jobs</h2>
            {loadingJobs ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-white border border-gray-200 rounded-xl animate-pulse" />)}
              </div>
            ) : myJobs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-white border border-gray-200 rounded-xl">
                You haven't posted any jobs yet.
              </div>
            ) : (
              <div className="space-y-3">
                {myJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => navigate(`/applicants/${job.id}`)}
                    className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-violet-300 hover:shadow-sm transition-all"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.location} · {job.status === 'active' ? 'Active' : 'Closed'}</p>
                    </div>
                    <span className="text-xs text-violet-600 font-medium">View applicants →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function ActionCard({ icon, title, desc, onClick, color }) {
  const colors = {
    violet: 'bg-violet-50 border-violet-200 hover:border-violet-400',
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    emerald: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
  }
  return (
    <button onClick={onClick}
      className={`text-left p-5 rounded-xl border transition-all ${colors[color]}`}>
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-medium text-gray-900 text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{desc}</p>
    </button>
  )
}