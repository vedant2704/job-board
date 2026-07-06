import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'

export default function ResumeUpload() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [resume, setResume] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.get('/api/resume/me')
      .then(({ data }) => { if (data.resume) setResume(data.resume) })
      .catch(console.error)
  }, [])

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.endsWith('.pdf')) { setError('Only PDF files accepted'); return }
    if (file.size > 5 * 1024 * 1024) { setError('File too large — max 5MB'); return }

    setError(''); setSuccess(''); setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post('/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResume(data.resume)
      setSuccess('Resume uploaded! Skills are being extracted in the background…')
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally { setUploading(false) }
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Your Resume</h1>
        <p className="text-sm text-gray-500 mb-8">Upload your PDF resume to enable AI-powered job matching</p>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-6
            ${dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-300 hover:border-violet-300 hover:bg-gray-50'}`}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Uploading and processing…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Drop your PDF here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF only · Max 5MB</p>
              </div>
            </div>
          )}
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}
        {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">{success}</div>}

        {/* Current resume */}
        {resume && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{resume.filename}</p>
                <p className="text-xs text-gray-400">Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Extracted skills */}
            {resume.extracted_skills?.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Extracted skills</p>
                <div className="flex flex-wrap gap-2">
                  {resume.extracted_skills.map((skill) => (
                    <span key={skill} className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                Extracting skills in the background…
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {resume && (
          <button onClick={() => navigate('/matches')}
            className="w-full py-3 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            View AI job matches
          </button>
        )}
      </div>
    </div>
  )
}
