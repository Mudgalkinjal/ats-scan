import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import axios from 'axios'

const ResumePage: React.FC = () => {
  const location = useLocation()
  const { resume } = location.state || {}

  const exportPDF = async (resumeText: string) => {
    if (!resumeText) {
      console.error('❌ Error: Resume text is missing')
      return
    }

    const removeDuplicates = (text: string) => {
      return text
        .split('\n')
        .filter((line, index, arr) => line !== arr[index - 1]) // ✅ Remove consecutive duplicates
        .join('\n')
    }

    const cleanedResumeText = removeDuplicates(resumeText)

    const structuredResume = {
      summary:
        cleanedResumeText.split('PROFESSIONAL EXPERIENCE')[0]?.trim() || '',
      experience:
        cleanedResumeText
          .split('PROJECTS')[0]
          .split('PROFESSIONAL EXPERIENCE')[1]
          ?.trim() || '',
      projects:
        cleanedResumeText.split('SKILLS')[0].split('PROJECTS')[1]?.trim() || '',
      skills:
        cleanedResumeText.split('EDUCATION')[0].split('SKILLS')[1]?.trim() ||
        '',
      education:
        cleanedResumeText
          .split('WHY NBC UNIVERSAL?')[0]
          .split('EDUCATION')[1]
          ?.trim() || '',
      whyNbc: cleanedResumeText.split('WHY NBC UNIVERSAL?')[1]?.trim() || '',
    }

    console.log('📄 Cleaned Resume Data:', structuredResume) // Debug log

    try {
      const response = await fetch('http://localhost:5001/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structuredResume),
      })

      if (!response.ok) {
        console.error('❌ Failed to export PDF:', await response.json())
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('❌ Network or Server Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Resume Analysis
          </h1>
          <p className="text-gray-500">Review your optimized resume below</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
              {resume}
            </pre>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              to="/"
              className="px-6 py-2 text-gray-600 hover:text-gray-900 
                transition-colors font-medium rounded-lg border border-gray-200 
                hover:border-gray-300"
            >
              ← Scan Again
            </Link>
            <button
              onClick={() => exportPDF(resume)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm">
          Tip: Copy the formatted resume or export as PDF to share with
          employers
        </p>
      </div>
    </div>
  )
}

export default ResumePage
