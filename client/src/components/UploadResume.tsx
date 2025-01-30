// UploadResume.tsx
import { useState } from 'react'
import axios from 'axios'

const UploadResume = () => {
  const [resume, setResume] = useState('')

  const handleUpload = async () => {
    await axios.post('http://localhost:5001/upload-resume', { resume })
    alert('Resume uploaded successfully!')
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
        onChange={(e) => setResume(e.target.value)}
        rows={8}
        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          placeholder-gray-400 text-gray-700 transition-colors resize-none"
        placeholder="Paste your resume text here..."
      />
      <div className="flex justify-center">
        <button
          onClick={handleUpload}
          disabled={!resume}
          className={`px-6 py-2 text-base font-semibold text-white rounded-lg 
            transition-all duration-200 transform hover:scale-105
            ${
              resume
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
        >
          Upload Resume
        </button>
      </div>
    </div>
  )
}

export default UploadResume
