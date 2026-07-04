import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
  { value: 'internship', label: 'Internship' },
]

export default function PostJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    job_type: 'full_time', salary_min: '', salary_max: '',
    skills_required: [], experience_years: 0,
  })
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills_required.includes(s)) {
      setForm((f) => ({ ...f, skills_required: [...f.skills_required, s] }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill) =>
    setForm((f) => ({ ...f, skills_required: f.skills_required.filter((s) => s !== skill) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        experience_years: parseInt(form.experience_years) || 0,
      }
      await api.post('/api/jobs', payload)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post job')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Post a job</h1>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          {error && <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job title *</label>
              <input name="title" value={form.title} onChange={handleChange} required
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input name="location" value={form.location} onChange={handleChange} required
                  placeholder="e.g. Mumbai / Remote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job type</label>
                <select name="job_type" value={form.job_type} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                  {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min salary ($/yr)</label>
                <input name="salary_min" type="number" value={form.salary_min} onChange={handleChange}
                  placeholder="60000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max salary ($/yr)</label>
                <input name="salary_max" type="number" value={form.salary_max} onChange={handleChange}
                  placeholder="90000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (yrs)</label>
                <input name="experience_years" type="number" value={form.experience_years} onChange={handleChange}
                  min="0" max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required skills</label>
              <div className="flex gap-2 mb-2">
                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                <button type="button" onClick={addSkill}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.skills_required.map((s) => (
                  <span key={s} className="flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="text-violet-400 hover:text-violet-700">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required
                rows={6} placeholder="Describe the role, responsibilities, and what you're looking for…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60">
                {loading ? 'Posting…' : 'Post job'}
              </button>
              <button type="button" onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
