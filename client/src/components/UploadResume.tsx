import { useState } from 'react'
import axios from 'axios'
interface UploadResumeProps {
  onResumeChange: (resume: string) => void
}

const UploadResume = ({ onResumeChange }: UploadResumeProps) => {
  const [resume, setResume] = useState('')
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setResume(text)
    onResumeChange(text)
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="resume"
        className="block text-lg font-medium text-gray-700 mb-2"
      >
        Paste Your Original Resume
      </label>
      <textarea
        id="resume"
        value={resume}
        onChange={handleChange}
        rows={8}
        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 
            focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            placeholder-gray-400 text-gray-700 transition-colors resize-none"
        placeholder="Paste your resume text here..."
      />
    </div>
  )
}

export default UploadResume
