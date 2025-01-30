import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import bodyParser from 'body-parser'
import OpenAI from 'openai'
import fs from 'fs'
import PDFDocument from 'pdfkit'
import 'dotenv/config'
import { Request, Response } from 'express'

const app = express()
app.use(cors())
app.use(bodyParser.json())

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/ats_scanner')

const jobSchema = new mongoose.Schema({
  description: String,
  resume: String,
})
const Job = mongoose.model('Job', jobSchema)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.post('/upload-resume', async (req, res) => {
  const { resume } = req.body

  try {
    // Save the resume in MongoDB
    const newJob = new Job({ description: 'Original Resume', resume })
    await newJob.save()

    res.json({ message: 'Resume saved successfully!' })
  } catch (error) {
    res.status(500).json({ error: 'Error saving resume' })
  }
})

app.post(
  '/scan',
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { description } = req.body

      const originalJob = await Job.findOne({ description: 'Original Resume' })

      if (!originalJob) {
        res
          .status(404)
          .json({ error: 'No original resume found. Please upload one first.' })
        return
      }

      const prompt = `Here is my original resume:\n${originalJob.resume}\n\nTweak my resume to match the following job description:\n${description}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 1000,
      })

      res.json({ resume: response.choices[0].message.content })
    } catch (error) {
      console.error('Error generating resume:', error)
      res.status(500).json({ error: 'Error generating resume' })
    }
  }
)

const normalizeText = (text: string) => {
  return text
    .replace(/[^\x00-\x7F]/g, '') // ✅ Remove corrupted non-ASCII characters
    .replace(/\n•/g, '\n-') // ✅ Replace Unicode bullet points with dashes
    .replace(/\s+/g, ' ') // ✅ Remove extra spaces
    .trim()
}

// Load environment variables
const USER_NAME = process.env.USER_NAME || 'Your Name'
const USER_LOCATION = process.env.USER_LOCATION || 'Location'
const GITHUB_URL = process.env.GITHUB_URL || 'https://github.com/'
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || 'https://yourportfolio.com'
const LINKEDIN_URL = process.env.LINKEDIN_URL || 'https://linkedin.com'
const EMAIL = process.env.EMAIL || 'your@email.com'
const PHONE = process.env.PHONE || '000-000-0000'

app.post('/export-pdf', (req: express.Request, res: express.Response) => {
  console.log('Incoming PDF Export Request:', req.body)

  const { summary, experience, projects, skills, education, whyNbc } = req.body

  if (!summary || !experience || !skills || !education) {
    res.status(400).json({ error: 'Missing required resume sections.' })
    return
  }

  res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"')
  res.setHeader('Content-Type', 'application/pdf')

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, left: 50, right: 50, bottom: 50 },
  })
  doc.pipe(res)

  // **1️⃣ HEADER (Personal Information)**
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor('#333')
    .text(USER_NAME, { align: 'center' })

  doc.moveDown(0.5)
  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#444')
    .text(
      `${USER_LOCATION} - GitHub: ${GITHUB_URL} - Portfolio: ${PORTFOLIO_URL} - LinkedIn: ${LINKEDIN_URL} - ${EMAIL} - ${PHONE}`,
      { align: 'center' }
    )

  doc.moveDown(1)

  // **2️⃣ Resume Content**
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#0056b3')
    .text('SUMMARY', { underline: true })
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(12).fillColor('#000').text(summary)

  doc.moveDown()
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#0056b3')
    .text('PROFESSIONAL EXPERIENCE', { underline: true })
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(12).fillColor('#000').text(experience)

  doc.moveDown()
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#0056b3')
    .text('PROJECTS', { underline: true })
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(12).fillColor('#000').text(projects)

  doc.moveDown()
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#0056b3')
    .text('SKILLS', { underline: true })
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(12).fillColor('#000').text(skills)

  doc.moveDown()
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#0056b3')
    .text('EDUCATION', { underline: true })
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(12).fillColor('#000').text(education)

  if (whyNbc) {
    doc.moveDown()
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#0056b3')
      .text('WHY NBC UNIVERSAL?', { underline: true })
    doc.moveDown(0.5)
    doc.font('Helvetica').fontSize(12).fillColor('#000').text(whyNbc)
  }

  doc.moveDown(2)
  doc
    .fontSize(10)
    .fillColor('#888')
    .text('Generated by ATS Resume Scanner', { align: 'center' })

  doc.end()
})

app.listen(5001, () => console.log('Server running on port 5001'))
