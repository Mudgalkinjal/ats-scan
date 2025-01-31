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
mongoose_1.default
    .connect('mongodb://localhost:27017/ats_scanner')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
const jobSchema = new mongoose_1.default.Schema({
    description: String,
    resume: String,
    updatedResume: { type: mongoose_1.default.Schema.Types.Mixed, required: true },
});
const Job = mongoose_1.default.model('Job', jobSchema);
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
const normalizeText = (text) => {
    const unwantedWords = [
        'PROFESSIONAL EXPERIENCE',
        'PROJECTS AND CONTRIBUTIONS',
        'CERTIFICATION AND TRAINING',
        'EDUCATION',
        'WHY COMPANY?',
    ];
    const regex = new RegExp(`\\b(${unwantedWords.join('|')})\\b`, 'gi');
    text
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/\n•/g, '\n-')
        .replace(/\s+/g, ' ')
        .trim();
};
const extractSections = (text) => {
    const sections = {};
    const sectionConfig = [
        { key: 'summary', label: 'Summary' },
        { key: 'experience1', label: process.env.Company1 || 'Company 1' },
        { key: 'experience2', label: process.env.Company2 || 'Company 2' },
        { key: 'experience3', label: process.env.Company3 || 'Company 3' },
        { key: 'keyCompetencies', label: 'Key Competencies' },
        { key: 'whyCompany', label: 'WHY ' },
    ];
    sectionConfig.forEach((current, index) => {
        const next = sectionConfig[index + 1];
        const regex = new RegExp(`${current.label}\\s*[:\\-]*\\s*([\\s\\S]*?)\\s*(?=${(next === null || next === void 0 ? void 0 : next.label) || '$'})`, 'i');
        const match = text.match(regex);
        if (match) {
            let content = match[1].trim();
            const dateMatch = content.match(/-?\s*([A-Za-z]+\s\d{4}\s*-\s*[A-Za-z]+\s\d{4})/);
            if (dateMatch) {
                const dates = dateMatch[1];
                content = content.replace(dateMatch[0], '').trim();
                sections[current.key] = `${current.label} (${dates})\n${content}`;
            }
            else {
                sections[current.key] = content;
            }
        }
    });
    return sections;
};
app.post('/scan', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { description, resumeText } = req.body;
        if (!resumeText) {
            res.status(400).json({ error: 'No resume uploaded' });
            return;
        }
        const cleanedResume = normalizeText(resumeText);
        const prompt = `Generate ATS-optimized resume:\nResume: ${cleanedResume}\nJob: ${description}\nRequirements: ${process.env.resumeReq}`;
        const completion = yield openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'system', content: prompt }],
            max_tokens: 1000,
        });
        console.log('completion.choices[0].message.content');
        console.log(completion.choices[0].message.content);
        console.log('completion.choices[0].message.content');
        const structuredResume = extractSections(completion.choices[0].message.content || '');
        console.log('structuredResume');
        console.log(structuredResume);
        console.log('structuredResume');
        yield new Job({
            description,
            resume: cleanedResume,
            updatedResume: structuredResume,
        }).save();
        res.json({ resume: structuredResume });
    }
    catch (error) {
        console.error('Error generating resume:', error);
        res.status(500).json({ error: 'Error generating resume' });
    }
}));
const USER_NAME = process.env.USER_NAME || 'Your Name';
const USER_LOCATION = process.env.USER_LOCATION || 'Location';
const GITHUB_URL = process.env.GITHUB_URL || 'https://github.com/';
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || 'https://yourportfolio.com';
const LINKEDIN_URL = process.env.LINKEDIN_URL || 'https://linkedin.com';
const EMAIL = process.env.EMAIL || 'your@email.com';
const PHONE = process.env.PHONE || '000-000-0000';
const USER_TITLE = process.env.PHONE || 'WEB DEVELOPER';
const PDF_MARGINS = { top: 40, left: 50, right: 50, bottom: 40 };
const FONT_SETTINGS = {
    primary: 'Helvetica',
    bold: 'Helvetica-Bold',
    sizes: { header: 20, sectionTitle: 12, body: 11, footer: 9 },
};
const COLORS = {
    primary: '#333',
    secondary: '#444',
    accent: '#888',
};
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
};
app.post('/export-pdf', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { summary, experience, keyCompetencies, whyCompany } = req.body;
        if (!summary || !experience) {
            res.status(400).json({ error: 'Missing required resume sections' });
            return;
        }
        const doc = new pdfkit_1.default({
            size: 'A4',
            margins: { top: 40, left: 50, right: 50, bottom: 40 },
        });
        res.setHeader('Content-Disposition', 'attachment; filename="optimized_resume.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);
        doc
            .font(FONT_SETTINGS.bold)
            .fontSize(FONT_SETTINGS.sizes.header)
            .fillColor(COLORS.primary)
            .text(`${CONTACT_INFO.name} · ${CONTACT_INFO.title}`, { align: 'left' });
        doc
            .font(FONT_SETTINGS.primary)
            .fontSize(FONT_SETTINGS.sizes.body - 1)
            .fillColor(COLORS.secondary)
            .moveDown(0.5);
        const contactItems = [
            CONTACT_INFO.location,
            ...CONTACT_INFO.links,
            CONTACT_INFO.email,
            CONTACT_INFO.phone,
        ];
        contactItems.forEach((item, index) => {
            const isLink = typeof item !== 'string';
            const text = isLink ? item.text : item;
            const options = {
                continued: index < contactItems.length - 1,
                link: isLink ? item.link : undefined,
                underline: isLink,
            };
            doc.text(index === 0 ? text : `- ${text}`, options);
        });
        doc.moveDown(1.5);
        const addSection = (title, content) => {
            if (!(content === null || content === void 0 ? void 0 : content.trim()) || content.trim() === 'N/A')
                return;
            doc
                .font(FONT_SETTINGS.bold)
                .fontSize(FONT_SETTINGS.sizes.sectionTitle)
                .fillColor(COLORS.primary)
                .text(title.toUpperCase(), { underline: true })
                .moveDown(0.5);
            doc
                .font(FONT_SETTINGS.primary)
                .fontSize(FONT_SETTINGS.sizes.body)
                .fillColor(COLORS.primary);
            content
                .split('\n')
                .filter((line) => line.trim())
                .forEach((line) => {
                const isBullet = line.trim().startsWith('•');
                const isExperience = title === 'PROFESSIONAL EXPERIENCE';
                if (isBullet) {
                    handleBulletPoint(doc, line, title);
                }
                else if (isExperience) {
                    handleExperienceLine(doc, line);
                }
                else {
                    doc.text(line.trim());
                }
                doc.moveDown(0.4);
            });
            doc.moveDown(0.8);
        };
        addSection('SUMMARY', summary);
        addSection('PROFESSIONAL EXPERIENCE', experience);
        if (keyCompetencies)
            addSection('KEY COMPETENCIES', keyCompetencies);
        if (whyCompany) {
            const [companyName, ...reasonParts] = whyCompany.split('?');
            const reason = reasonParts.join('?').trim(); // Handle company names with '?'
            addSection(`WHY ${companyName.toUpperCase()}?`, reason);
        }
        doc
            .addPage()
            .fontSize(FONT_SETTINGS.sizes.footer)
            .fillColor(COLORS.accent)
            .text('Generated by ATS Optimizer', { align: 'center' });
        doc.end();
    }
    catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
}));
const handleBulletPoint = (doc, line, title) => {
    const bulletContent = line.trim().substring(1).trim();
    const colonIndex = bulletContent.indexOf(':');
    if (colonIndex !== -1 && title === 'KEY COMPETENCIES') {
        const [boldText, regularText] = bulletContent.split(/:(.+)/);
        doc
            .font(FONT_SETTINGS.bold)
            .text(`• ${boldText}:`, { indent: 15, continued: true })
            .font(FONT_SETTINGS.primary)
            .text(regularText || '');
    }
    else {
        doc.text(`• ${bulletContent}`, { indent: 15 });
    }
};
const handleExperienceLine = (doc, line) => {
    console.log('handleExperienceLine');
    console.log(line);
    console.log('handleExperienceLine');
    const experienceMatch = line.match(/(.*?)\s*-\s*([A-Za-z]+\s\d{4}\s*-\s*[A-Za-z]+\s\d{4})/);
    if (experienceMatch) {
        const [, position, dates] = experienceMatch;
        doc.font(FONT_SETTINGS.bold).text(position.trim(), { continued: true });
        doc
            .font(FONT_SETTINGS.primary)
            .text(`  ${dates.trim()}`, { align: 'right' });
    }
    else {
        doc.font(FONT_SETTINGS.bold).text(line.trim());
    }
};
app.listen(5001, () => console.log('Server running on port 5001'));
