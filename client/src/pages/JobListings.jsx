import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'

const JOB_TYPES = ['', 'full_time', 'part_time', 'contract', 'remote', 'internship']
const TYPE_LABELS = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', remote: 'Remote', internship: 'Internship' }

function JobCard({ job, onClick }) {
  return (
    <button onClick={onClick} className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-violet-300 hover:shadow-sm transition-all group w-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-violet-700 transition-colors">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{job.company} · {job.location}</p>
        </div>
        <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
          {TYPE_LABELS[job.job_type] || job.job_type}
        </span>
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{job.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.skills_required?.slice(0, 4).map((skill) => (
          <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{skill}</span>
        ))}
        {job.skills_required?.length > 4 && (
          <span className="text-xs text-gray-400">+{job.skills_required.length - 4} more</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {job.salary_min && job.salary_max ? (
          <span className="text-xs font-medium text-emerald-600">
            ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}/yr
          </span>
        ) : <span />}
        <span className="text-xs text-gray-400">
          {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </button>
  )
}

export default function JobListings() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [location, setLocation] = useState('')

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (jobType) params.set('job_type', jobType)
      if (location) params.set('location', location)
      const { data } = await api.get(`/api/jobs?${params}`)
      setJobs(data.jobs)
      setTotal(data.total)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchJobs() }, [])

  const handleSearch = (e) => { e.preventDefault(); fetchJobs() }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Search bar */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-5">Find your next role</h1>
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, company, or keyword…"
              className="flex-1 min-w-48 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
            <input
              value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="w-36 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
            <select
              value={jobType} onChange={(e) => setJobType(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">All types</option>
              {JOB_TYPES.filter(Boolean).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
            <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        <p className="text-sm text-gray-500 mb-4">{total} job{total !== 1 ? 's' : ''} found</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-white border border-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No jobs found — try a different search
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => navigate(`/jobs/${job.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
