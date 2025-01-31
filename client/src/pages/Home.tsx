import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import UploadResume from '../components/UploadResume'

const Home: React.FC = () => {
  const [jobDesc, setJobDesc] = useState('')
  const [resume, setResume] = useState('')

  const navigate = useNavigate()

  const handleScan = async () => {
    const res = await axios.post('http://localhost:5001/scan', {
      resumeText: resume,
      description: jobDesc,
    })
    console.log('API Response:', res.data)
    navigate('/resume', { state: { resume: res.data.resume } })
  }

  const handleResumeChange = async (text: string) => {
    setResume(text)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Job Description Analyzer
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
          <UploadResume onResumeChange={handleResumeChange} />

          <div className="space-y-6">
            <div>
              <label
                htmlFor="jobDesc"
                className="block text-lg font-medium text-gray-700 mb-3"
              >
                Paste Job Description
              </label>
              <textarea
                id="jobDesc"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 
                  focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                  placeholder-gray-400 text-gray-700 transition-colors resize-none"
                placeholder="Enter or paste the job description here..."
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleScan}
                disabled={!jobDesc}
                className={`px-8 py-3 text-lg font-semibold text-white rounded-lg 
                  transition-all duration-200 transform hover:scale-105 
                  ${
                    jobDesc
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                Analyze Resume Match
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm">
          We'll analyze your resume against this job description to highlight
          key matches and gaps
        </p>
      </div>
    </div>
  )
}

export default Home
