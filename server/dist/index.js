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
// MongoDB Connection
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
        // Save the resume in MongoDB
        const newJob = new Job({ description: 'Original Resume', resume });
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
        const prompt = `Here is my original resume:\n${originalJob.resume}\n\nTweak my resume to match the following job description:\n${description}`;
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
        .replace(/[^\x00-\x7F]/g, '') // ✅ Remove corrupted non-ASCII characters
        .replace(/\n•/g, '\n-') // ✅ Replace Unicode bullet points with dashes
        .replace(/\s+/g, ' ') // ✅ Remove extra spaces
        .trim();
};
app.post('/export-pdf', (req, res) => {
    console.log('Incoming PDF Export Request:', req.body); // Debugging log
    const { summary, experience, projects, skills, education, whyNbc } = req.body;
    if (!summary || !experience || !skills || !education) {
        res.status(400).json({ error: 'Missing required resume sections.' });
        return;
    }
    // Set response headers for PDF download
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    const doc = new pdfkit_1.default({
        size: 'A4',
        margins: { top: 50, left: 50, right: 50, bottom: 50 },
    });
    doc.pipe(res);
    doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#333')
        .text('KINJAL MUDGAL . FRONT END ENGINEER', { align: 'center' });
    doc.moveDown(0.5);
    doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#444')
        .text('Jersey City, NJ - GitHub - Portfolio - linkedin.com/in/kinjalmudgal - kinjalmudgal89@gmail.com - (408) 799-4827', { align: 'center' });
    doc.moveDown(1);
    doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0056b3')
        .text('SUMMARY', { underline: true });
    doc.moveDown(0.5);
    doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#000')
        .text(normalizeText(summary));
    doc.moveDown();
    doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0056b3')
        .text('PROFESSIONAL EXPERIENCE', { underline: true });
    doc.moveDown(0.5);
    doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#000')
        .text(normalizeText(experience));
    doc.moveDown();
    doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0056b3')
        .text('PROJECTS', { underline: true });
    doc.moveDown(0.5);
    doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#000')
        .text(normalizeText(projects));
    doc.moveDown();
    doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0056b3')
        .text('SKILLS', { underline: true });
    doc.moveDown(0.5);
    doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#000')
        .text(normalizeText(skills));
    doc.moveDown();
    doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0056b3')
        .text('EDUCATION', { underline: true });
    doc.moveDown(0.5);
    doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#000')
        .text(normalizeText(education));
    if (whyNbc) {
        doc.moveDown();
        doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .fillColor('#0056b3')
            .text('WHY NBC UNIVERSAL?', { underline: true });
        doc.moveDown(0.5);
        doc
            .font('Helvetica')
            .fontSize(12)
            .fillColor('#000')
            .text(normalizeText(whyNbc));
    }
    doc.moveDown(2);
    doc
        .fontSize(10)
        .fillColor('#888')
        .text('Generated by ATS Resume Scanner', { align: 'center' });
    doc.end();
});
app.listen(5001, () => console.log('Server running on port 5001'));
