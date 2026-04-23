import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { scamAnalystFlow } from './agents/scamAnalyst.js';
import { forensicFlow } from './agents/forensicSpecialist.js';
import { incidentResponderFlow } from './agents/incidentResponder.js';
import { reportNewScam, getScamCount } from './tools/report_new_scam.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Genkit with Google AI
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_API_KEY || '' })],
});

// Main orchestrator flow that connects all agents
export async function secureDigitalShield(userInput: string, onProgress?: (step: string, data?: any) => void) {
  if (onProgress) onProgress('Analyzing scam patterns...');
  const analysis = await scamAnalystFlow(userInput);
  if (onProgress) onProgress('Scam Analysis Complete', analysis);

  let forensics: any = {
    maliciousUrls: [],
    visualRedFlags: [],
    technicalEvidence: {},
  };

  if (analysis.requiresForensics) {
    if (onProgress) onProgress('Performing forensic analysis...');
    forensics = await forensicFlow({ extractedText: userInput }, onProgress);
    if (onProgress) onProgress('Forensic Analysis Complete', forensics);
  }

  if (onProgress) onProgress('Generating incident report...');
  const report = await incidentResponderFlow({
    analysis,
    forensics,
  });
  if (onProgress) onProgress('Incident Report Generated', report);

  if (analysis.scamProbability > 50) {
    if (onProgress) onProgress('Logging to database...');
    try {
      const scamName = forensics.maliciousUrls && forensics.maliciousUrls.length > 0
        ? `AI Detected Scam - ${forensics.maliciousUrls[0]}`
        : `AI Detected Scam Incident`;

      await reportNewScam({
        name: scamName,
        registration_number: 'N/A',
        websites: forensics.maliciousUrls || [],
      });
    } catch (e) {
      console.error('⚠️ Database log failed:', e);
    }
  }

  return { analysis, forensics, report };
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(process.cwd(), 'public')));

app.post('/api/analyze', async (req, res) => {
  const { input } = req.body;
  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  console.log('🚀 Starting Analysis for user input...');

  try {
    const result = await secureDigitalShield(input);
    res.json(result);
  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/download-report', (req, res) => {
  const filePath = path.join(process.cwd(), 'PDRM_Police_Report.pdf');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'PDRM_Police_Report.pdf');
  } else {
    res.status(404).json({ error: 'Report not generated yet' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const count = await getScamCount();
    res.json({ firebaseCaseCount: count });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-police-report', async (req, res) => {
  try {
    const { reportContent, userName } = req.body;

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_APP_PASSWORD;

    if (!emailUser || !emailPass) {
      return res.status(500).json({ error: 'Email configuration missing on server.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: emailUser,
      to: 'rickytan5350@gmail.com',
      subject: `🚨 Official Police Report Submission - Analyst AI`,
      text: `A new police report has been submitted.\n\n${reportContent}`,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Police report email sent to rickytan5350@gmail.com');
    res.json({ success: true, message: 'Report sent.' });
  } catch (error: any) {
    console.error('Email sending failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend fallback for SPA (Removed due to Express 5 syntax issues, default static serving handles root)

app.listen(port, () => {
  console.log(`\n🚀 Secure Digital Shield Server running at http://localhost:${port}`);
  console.log(`📁 Serving frontend from ${path.join(process.cwd(), 'public')}\n`);
});

export { reportNewScam };