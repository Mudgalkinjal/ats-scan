"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const openai_1 = __importDefault(require("openai"));
const pdfkit_1 = __importDefault(require("pdfkit"));
require("dotenv/config");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
mongoose_1.default.connect('mongodb://localhost:27017/ats_scanner');
const jobSchema = new mongoose_1.default.Schema({
    description: String,
    resume: String,
});
const Job = mongoose_1.default.model('Job', jobSchema);
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
app.post('/upload-resume', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { resume } = req.body;
    try {
        const cleanedResume = normalizeText(resume);
        const newJob = new Job({
            description: 'Original Resume',
            resume: cleanedResume,
        });
        yield newJob.save();
        res.json({ message: 'Resume saved successfully!' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error saving resume' });
    }
}));
app.post('/scan', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { description } = req.body;
        const originalJob = yield Job.findOne({ description: 'Original Resume' });
        if (!originalJob) {
            res
                .status(404)
                .json({ error: 'No original resume found. Please upload one first.' });
            return;
        }
        const prompt = `I need to generate an ATS-optimized resume tailored for a specific job. Below are two inputs:
My Current Resume: ${originalJob.resume}
Job Description: ${description}

Resume Requirements:

Professional Summary (110 words): Craft a compelling summary highlighting my expertise, key skills, and relevant experience. Use the most impactful keywords from the job description.
Experience:
Company 1 & 2 (180-200 words each): Detail my contributions, achievements, and impact. Ensure it aligns with the job description and includes relevant keywords.
Company 3 (40-50 words): Keep concise but highlight key responsibilities.
Projects and Contributions (50-70 words): Summarize key projects, technologies used, and contributions aligning with the job description.
Core Competencies (80-120 words): List relevant skills and expertise using industry keywords from the job description.
Certifications and Training: Do not modify. Keep the same wording as my current resume.
Key Competencies (50-60 words): Focus on job-relevant competencies.
Education: Do not change; keep as is.
WHY <Company Name>? (60-80 words): Write a persuasive response on why I am interested in this company, referencing their values, culture, and role alignment.
Ensure the resume layout remains identical to my original resume while optimizing content for ATS parsing. Prioritize clarity, relevance, and action-driven language. Maintain a professional and concise tone.`;
        const response = yield openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'system', content: prompt }],
            max_tokens: 1000,
        });
        res.json({ resume: response.choices[0].message.content });
    }
    catch (error) {
        console.error('Error generating resume:', error);
        res.status(500).json({ error: 'Error generating resume' });
    }
}));
const normalizeText = (text) => {
    return text
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/\n•/g, '\n-')
        .replace(/\s+/g, ' ')
        .trim();
};
const USER_NAME = process.env.USER_NAME || 'Your Name';
const USER_LOCATION = process.env.USER_LOCATION || 'Location';
const GITHUB_URL = process.env.GITHUB_URL || 'https://github.com/';
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || 'https://yourportfolio.com';
const LINKEDIN_URL = process.env.LINKEDIN_URL || 'https://linkedin.com';
const EMAIL = process.env.EMAIL || 'your@email.com';
const PHONE = process.env.PHONE || '000-000-0000';
const USER_TITLE = process.env.PHONE || 'WEB DEVELOPER';
app.post('/export-pdf', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('📥 Received Resume Data:', JSON.stringify(req.body, null, 2));
    const { summary, experience, projects, coreCompetencies, certifications, keyCompetencies, education, whyCompany, } = req.body;
    if (!summary || !experience || !coreCompetencies || !education) {
        console.error('❌ Missing required resume sections:', {
            summary,
            experience,
            coreCompetencies,
            education,
        });
        res.status(400).json({ error: 'Missing required resume sections.' });
        return;
    }
    const doc = new pdfkit_1.default({
        size: 'A4',
        margins: { top: 40, left: 50, right: 50, bottom: 40 },
    });
    res.setHeader('Content-Disposition', 'attachment; filename="optimized_resume.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    // Header Section
    doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#333')
        .text(`${USER_NAME} · ${USER_TITLE}`, { align: 'left' });
    // Contact Information with hyperlinks
    const contactLine = [
        USER_LOCATION,
        { text: 'GitHub', link: GITHUB_URL },
        { text: 'Portfolio', link: PORTFOLIO_URL },
        { text: 'LinkedIn', link: LINKEDIN_URL },
        EMAIL,
        PHONE,
    ];
    let contactY = doc.y;
    doc.font('Helvetica').fontSize(10).fillColor('#444');
    contactLine.forEach((item, index) => {
        if (typeof item === 'string') {
            doc.text(index === 0 ? item : `- ${item}`, {
                continued: index !== contactLine.length - 1,
                link: item.startsWith('http') ? item : undefined,
                underline: item.startsWith('http'),
            });
        }
        else {
            doc.text(index === 0 ? item.text : `- ${item.text}`, {
                continued: index !== contactLine.length - 1,
                link: item.link,
                underline: true,
            });
        }
    });
    doc.moveDown(1.5);
    // Improved section handler with proper formatting
    const addSection = (title, content) => {
        if (!content || content.trim() === 'N/A')
            return;
        doc
            .moveDown(0.8)
            .font('Helvetica-Bold')
            .fontSize(12)
            .fillColor('#333')
            .text(title.toUpperCase(), { underline: true })
            .moveDown(0.5);
        doc.font('Helvetica').fontSize(11).fillColor('#000');
        const lines = content.split('\n').filter((line) => line.trim() !== '');
        lines.forEach((line) => {
            const isExperienceSection = [
                'PROFESSIONAL EXPERIENCE',
                'EDUCATION',
            ].includes(title);
            const isBullet = line.trim().startsWith('•');
            if (isBullet) {
                const bulletContent = line.trim().substring(1).trim();
                const colonIndex = bulletContent.indexOf(':');
                if (colonIndex !== -1 && title === 'KEY COMPETENCIES') {
                    const [boldText, regularText] = bulletContent.split(/:(.+)/);
                    doc
                        .font('Helvetica-Bold')
                        .text(`• ${boldText}:`, { indent: 15, continued: true })
                        .font('Helvetica')
                        .text(regularText || '');
                }
                else {
                    doc.text(`• ${bulletContent}`, { indent: 15 });
                }
            }
            else if (isExperienceSection) {
                // Handle company/dates formatting
                const [positionInfo, dates] = line.split(/(?<=[a-zA-Z])\s*-\s*(?=\d)/);
                if (positionInfo && dates) {
                    doc
                        .font('Helvetica-Bold')
                        .text(positionInfo.trim(), { continued: true })
                        .font('Helvetica')
                        .text(`   ${dates.trim()}`, { align: 'right' });
                }
                else {
                    doc.font('Helvetica-Bold').text(line.trim());
                }
            }
            else if (title === 'EDUCATION') {
                const [degree, university] = line.split(/(?:\t| {2,})/);
                doc
                    .font('Helvetica-Bold')
                    .text(degree.trim(), { continued: true })
                    .font('Helvetica')
                    .text(university.trim(), { align: 'right' });
            }
            else {
                doc.text(line.trim());
            }
            doc.moveDown(0.4);
        });
        doc.moveDown(0.8);
    };
    // Add sections in order
    addSection('SUMMARY', summary);
    addSection('PROFESSIONAL EXPERIENCE', experience);
    addSection('PROJECTS AND CONTRIBUTIONS', projects);
    addSection('CORE COMPETENCIES & TECHNICAL SKILLS', coreCompetencies);
    addSection('CERTIFICATION AND TRAINING', certifications);
    addSection('KEY COMPETENCIES', keyCompetencies);
    addSection('EDUCATION', education);
    // Custom Why Company section
    if (whyCompany) {
        const [companyName, reason] = whyCompany
            .split(/[?]/)
            .map((s) => s.trim());
        addSection(`WHY ${companyName.toUpperCase()}?`, reason);
    }
    // Footer
    doc
        .moveDown(2)
        .fontSize(9)
        .fillColor('#888')
        .text('Generated by ATS Optimizer', { align: 'center' });
    doc.end();
}));
app.listen(5001, () => console.log('Server running on port 5001'));
