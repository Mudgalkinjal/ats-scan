import React from 'react'
import { useLocation, Link } from 'react-router-dom'

interface ResumeData {
  summary?: string
  experience1?: string
  experience2?: string
  experience3?: string
  keyCompetencies?: string
  whyCompany?: string
}

export const ResumePage: React.FC = () => {
  const location = useLocation()
  const resume = location.state?.resume as ResumeData
  console.log('---------')
  console.log(resume)
  console.log('---------')

  const handleExportPDF = async () => {
    try {
      const response = await fetch('http://localhost:5001/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'resume.pdf'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  if (!resume) {
    return (
      <div className="p-4 text-red-500">
        Error: No resume data available.{' '}
        <Link to="/" className="text-blue-500 hover:underline">
          Go back
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Optimized Resume
        </h1>

        <Section title="Summary" content={resume.summary || ''} />
        <Section
          title="Professional Experience"
          content={[
            resume.experience1 || '',
            resume.experience2 || '',
            resume.experience3 || '',
          ]}
        />
        <Section
          title="Key Competencies"
          content={resume.keyCompetencies || ''}
        />
        <Section title="Why This Company?" content={resume.whyCompany || ''} />

        <div className="mt-8 flex justify-end gap-4">
          <Link
            to="/"
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ← Back
          </Link>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            📄 Export PDF
          </button>
        </div>
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  content: string | string[]
}

const Section: React.FC<SectionProps> = ({ title, content }) => {
  const contentArray = Array.isArray(content) ? content : [content]

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-700 border-b pb-2">
        {title}
      </h2>
      {contentArray.map((text, index) => (
        <p key={index} className="text-gray-600 mb-3 whitespace-pre-wrap">
          {text || 'N/A'}
        </p>
      ))}
    </div>
  )
}
