import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import bodyParser from 'body-parser'
import OpenAI from 'openai'
import PDFDocument from 'pdfkit'
import 'dotenv/config'
import { Request, Response } from 'express'
const app = express()
app.use(cors())
app.use(bodyParser.json())
type PDFDocType = typeof PDFDocument extends new (...args: any) => infer T
  ? T
  : never

mongoose
  .connect('mongodb://localhost:27017/ats_scanner')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err))

const jobSchema = new mongoose.Schema({
  description: String,
  resume: String,
  updatedResume: { type: mongoose.Schema.Types.Mixed, required: true },
})
const Job = mongoose.model('Job', jobSchema)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const normalizeText = (text: string) => {
  const unwantedWords = [
    'PROFESSIONAL EXPERIENCE',
    'PROJECTS AND CONTRIBUTIONS',
    'CERTIFICATION AND TRAINING',
    'EDUCATION',
    'WHY COMPANY?',
  ]
  const regex = new RegExp(`\\b(${unwantedWords.join('|')})\\b`, 'gi')

  text
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\n•/g, '\n-')
    .replace(/\s+/g, ' ')
    .trim()
}

const extractSections = (text: string) => {
  const sections: Record<string, string> = {}
  const sectionConfig = [
    { key: 'summary', label: 'Summary' },
    { key: 'experience1', label: process.env.Company1 || 'Company 1' },
    { key: 'experience2', label: process.env.Company2 || 'Company 2' },
    { key: 'experience3', label: process.env.Company3 || 'Company 3' },
    { key: 'keyCompetencies', label: 'Key Competencies' },
    { key: 'whyCompany', label: 'WHY ' },
  ]

  sectionConfig.forEach((current, index) => {
    const next = sectionConfig[index + 1]
    const regex = new RegExp(
      `${current.label}\\s*[:\\-]*\\s*([\\s\\S]*?)\\s*(?=${
        next?.label || '$'
      })`,
      'i'
    )
    const match = text.match(regex)

    if (match) {
      let content = match[1].trim()
      const dateMatch = content.match(
        /-?\s*([A-Za-z]+\s\d{4}\s*-\s*[A-Za-z]+\s\d{4})/
      )

      if (dateMatch) {
        const dates = dateMatch[1]
        content = content.replace(dateMatch[0], '').trim()
        sections[current.key] = `${current.label} (${dates})\n${content}`
      } else {
        sections[current.key] = content
      }
    }
  })

  return sections
}

app.post(
  '/scan',
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { description, resumeText } = req.body

      if (!resumeText) {
        res.status(400).json({ error: 'No resume uploaded' })
        return
      }

      const cleanedResume = normalizeText(resumeText)

      const prompt = `Generate ATS-optimized resume:\nResume: ${cleanedResume}\nJob: ${description}\nRequirements: ${process.env.resumeReq}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 1000,
      })
      console.log('completion.choices[0].message.content')
      console.log(completion.choices[0].message.content)
      console.log('completion.choices[0].message.content')

      const structuredResume = extractSections(
        completion.choices[0].message.content || ''
      )
      console.log('structuredResume')
      console.log(structuredResume)
      console.log('structuredResume')
      await new Job({
        description,
        resume: cleanedResume,
        updatedResume: structuredResume,
      }).save()

      res.json({ resume: structuredResume })
    } catch (error) {
      console.error('Error generating resume:', error)
      res.status(500).json({ error: 'Error generating resume' })
    }
  }
)

const USER_NAME = process.env.USER_NAME || 'Your Name'
const USER_LOCATION = process.env.USER_LOCATION || 'Location'
const GITHUB_URL = process.env.GITHUB_URL || 'https://github.com/'
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || 'https://yourportfolio.com'
const LINKEDIN_URL = process.env.LINKEDIN_URL || 'https://linkedin.com'
const EMAIL = process.env.EMAIL || 'your@email.com'
const PHONE = process.env.PHONE || '000-000-0000'
const USER_TITLE = process.env.PHONE || 'WEB DEVELOPER'

interface ContactItem {
  text: string
  link?: string
}

interface PDFRequest {
  summary: string
  experience: string
  keyCompetencies?: string
  whyCompany?: string
}

const PDF_MARGINS = { top: 40, left: 50, right: 50, bottom: 40 }
const FONT_SETTINGS = {
  primary: 'Helvetica' as const,
  bold: 'Helvetica-Bold' as const,
  sizes: { header: 20, sectionTitle: 12, body: 11, footer: 9 },
}
const COLORS = {
  primary: '#333',
  secondary: '#444',
  accent: '#888',
}

const CONTACT_INFO = {
  name: process.env.USER_NAME || 'Your Name',
  title: process.env.USER_TITLE || 'Web Developer',
  location: process.env.USER_LOCATION || 'City, Country',
  links: [
    { text: 'GitHub', link: process.env.GITHUB_URL },
    { text: 'Portfolio', link: process.env.PORTFOLIO_URL },
    { text: 'LinkedIn', link: process.env.LINKEDIN_URL },
  ],
  email: process.env.EMAIL || 'email@example.com',
  phone: process.env.PHONE || '+1 234 567 890',
}

app.post('/export-pdf', async (req: Request, res: Response) => {
  try {
    const { summary, experience, keyCompetencies, whyCompany }: PDFRequest =
      req.body

    if (!summary || !experience) {
      res.status(400).json({ error: 'Missing required resume sections' })
      return
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, left: 50, right: 50, bottom: 40 },
    })

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="optimized_resume.pdf"'
    )
    res.setHeader('Content-Type', 'application/pdf')
    doc.pipe(res)

    doc
      .font(FONT_SETTINGS.bold)
      .fontSize(FONT_SETTINGS.sizes.header)
      .fillColor(COLORS.primary)
      .text(`${CONTACT_INFO.name} · ${CONTACT_INFO.title}`, { align: 'left' })

    doc
      .font(FONT_SETTINGS.primary)
      .fontSize(FONT_SETTINGS.sizes.body - 1)
      .fillColor(COLORS.secondary)
      .moveDown(0.5)

    const contactItems: (string | ContactItem)[] = [
      CONTACT_INFO.location,
      ...CONTACT_INFO.links,
      CONTACT_INFO.email,
      CONTACT_INFO.phone,
    ]

    contactItems.forEach((item, index) => {
      const isLink = typeof item !== 'string'
      const text = isLink ? item.text : item
      const options = {
        continued: index < contactItems.length - 1,
        link: isLink ? item.link : undefined,
        underline: isLink,
      }

      doc.text(index === 0 ? text : `- ${text}`, options)
    })

    doc.moveDown(1.5)

    const addSection = (title: string, content: string) => {
      if (!content?.trim() || content.trim() === 'N/A') return

      doc
        .font(FONT_SETTINGS.bold)
        .fontSize(FONT_SETTINGS.sizes.sectionTitle)
        .fillColor(COLORS.primary)
        .text(title.toUpperCase(), { underline: true })
        .moveDown(0.5)

      doc
        .font(FONT_SETTINGS.primary)
        .fontSize(FONT_SETTINGS.sizes.body)
        .fillColor(COLORS.primary)

      content
        .split('\n')
        .filter((line) => line.trim())
        .forEach((line) => {
          const isBullet = line.trim().startsWith('•')
          const isExperience = title === 'PROFESSIONAL EXPERIENCE'

          if (isBullet) {
            handleBulletPoint(doc, line, title)
          } else if (isExperience) {
            handleExperienceLine(doc, line)
          } else {
            doc.text(line.trim())
          }
          doc.moveDown(0.4)
        })

      doc.moveDown(0.8)
    }

    addSection('SUMMARY', summary)
    addSection('PROFESSIONAL EXPERIENCE', experience)
    if (keyCompetencies) addSection('KEY COMPETENCIES', keyCompetencies)

    if (whyCompany) {
      const [companyName, ...reasonParts] = whyCompany.split('?')
      const reason = reasonParts.join('?').trim() // Handle company names with '?'
      addSection(`WHY ${companyName.toUpperCase()}?`, reason)
    }

    doc
      .addPage()
      .fontSize(FONT_SETTINGS.sizes.footer)
      .fillColor(COLORS.accent)
      .text('Generated by ATS Optimizer', { align: 'center' })

    doc.end()
  } catch (error) {
    console.error('PDF Generation Error:', error)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
})

const handleBulletPoint = (doc: PDFDocType, line: string, title: string) => {
  const bulletContent = line.trim().substring(1).trim()
  const colonIndex = bulletContent.indexOf(':')

  if (colonIndex !== -1 && title === 'KEY COMPETENCIES') {
    const [boldText, regularText] = bulletContent.split(/:(.+)/)
    doc
      .font(FONT_SETTINGS.bold)
      .text(`• ${boldText}:`, { indent: 15, continued: true })
      .font(FONT_SETTINGS.primary)
      .text(regularText || '')
  } else {
    doc.text(`• ${bulletContent}`, { indent: 15 })
  }
}

const handleExperienceLine = (doc: PDFDocType, line: string) => {
  console.log('handleExperienceLine')
  console.log(line)
  console.log('handleExperienceLine')

  const experienceMatch = line.match(
    /(.*?)\s*-\s*([A-Za-z]+\s\d{4}\s*-\s*[A-Za-z]+\s\d{4})/
  )

  if (experienceMatch) {
    const [, position, dates] = experienceMatch

    doc.font(FONT_SETTINGS.bold).text(position.trim(), { continued: true })

    doc
      .font(FONT_SETTINGS.primary)
      .text(`  ${dates.trim()}`, { align: 'right' })
  } else {
    doc.font(FONT_SETTINGS.bold).text(line.trim())
  }
}

app.listen(5001, () => console.log('Server running on port 5001'))
