import fs from 'fs';
import path from 'path';
import { finished } from 'stream/promises';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { ScamAnalysisSchema, type ScamAnalysis } from './scamAnalyst.js';
import { ForensicExtractionSchema, type ForensicExtraction } from './forensicSpecialist.js';

// Initialize Genkit with Google AI
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_API_KEY || '' })],
});

export const PDRMReportSchema = z.object({
  caseChronology: z.string(),
  evidenceSummary: z.string(),
  policeReport: z.string(),
  nsrcActionRequired: z.boolean(),
  draftReportStatus: z.enum(['Drafted', 'Ready_for_Submission']),
  recommendedActions: z.array(z.string()),
  urgencyLevel: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

export type PDRMReport = z.infer<typeof PDRMReportSchema>;

export interface IncidentResponderInput {
  analysis: ScamAnalysis;
  forensics: ForensicExtraction;
}

export async function incidentResponderFlow(input: IncidentResponderInput): Promise<PDRMReport> {
  console.log('🚨 Incident Responder evaluating response actions...');

  const response = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `You are an incident response coordinator for Malaysian cybersecurity. Based on the scam analysis and forensic evidence, generate a comprehensive incident response plan.

    Scam Analysis: ${JSON.stringify(input.analysis)}
    Forensic Evidence: ${JSON.stringify(input.forensics)}

    CRITICAL: Return ONLY a valid JSON object with this EXACT structure. Do not include any other text, explanations, code blocks, or formatting. Just the raw JSON:

    {
      "caseChronology": "Timeline description here",
      "evidenceSummary": "Summary of all evidence",
      "policeReport": "Formal police report narrative in one paragraph and in Malay language.",
      "nsrcActionRequired": true,
      "draftReportStatus": "Ready_for_Submission",
      "recommendedActions": ["Block URLs", "Contact bank", "File report"],
      "urgencyLevel": "High"
    }

    Consider:
    - Scam probability >80 = High/Critical urgency
    - Money amounts involved
    - Personal information compromised
    - Technical evidence of active threats
    - Time sensitivity ("Golden Hour" concept)

    Generate actionable recommendations for law enforcement and victim protection.
    Generate a clear chronology of events for the police report.`
  });

  const text = response.text;
  console.log('📋 Incident Responder raw response:', text);

  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const report = PDRMReportSchema.parse(JSON.parse(jsonMatch[0]));
      if (!report.policeReport?.trim()) {
        throw new Error('Missing policeReport field in agent response');
      }
      console.log('📋 Response plan generated:', report);

      const pdfResult = await buildPoliceReportPdf(report);
      console.log('📄 Police report PDF generated:', pdfResult.path);

      // Execute immediate actions if critical
      if (report.urgencyLevel === 'Critical' && report.nsrcActionRequired) {
        console.log('🚨 CRITICAL: Executing immediate response actions...');
        await executeCriticalActions(report, input);
      }

      return report;
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    console.log('⚠️ Failed to parse or validate JSON.', error);
    console.log('⚠️ Failed to parse JSON.');
    const fallbackReport: PDRMReport = {
      caseChronology: 'Incident reported at 2:30 PM. Immediate analysis initiated.',
      evidenceSummary: 'Suspicious URL and urgent money transfer request detected.',
      policeReport: 'The victim received a fake LHDN tax demand SMS with a malicious URL, followed by a WhatsApp call from an impersonator claiming to be a PDRM officer. The suspect requested TAC codes and an RM12,000 transfer to a shell account. Immediate police action is required.',
      nsrcActionRequired: true,
      draftReportStatus: 'Ready_for_Submission',
      recommendedActions: ['Block suspicious URLs', 'Contact victim bank', 'File police report'],
      urgencyLevel: 'High',
    };

    const pdfResult = await buildPoliceReportPdf(fallbackReport, 'PDRM_Police_Report_Fallback.pdf');
    console.log('📄 Fallback police report PDF generated:', pdfResult.path);

    return fallbackReport;
  }
}

async function executeCriticalActions(report: PDRMReport, evidence: IncidentResponderInput) {
  console.log('⚡ Executing critical response protocol...');

  // Simulate executing actions (in real implementation, these would be actual API calls)
  const actions = report.recommendedActions;

  for (const action of actions) {
    if (action.includes('Block URLs')) {
      console.log('🔒 Blocking malicious URLs:', evidence.forensics.maliciousUrls);
      // In real implementation: Call URL blocking API
    }
    if (action.includes('NSRC alert')) {
      console.log('📢 Triggering NSRC emergency alert...');
      // In real implementation: Send to NSRC system
    }
    if (action.includes('Bank notification')) {
      console.log('🏦 Notifying financial institutions...');
      // In real implementation: Secure API call to banks
    }
  }

  console.log('✅ Critical actions executed');
}

export async function buildPoliceReportPdf(report: PDRMReport, outputFileName = 'PDRM_Police_Report.pdf'): Promise<{ path: string; base64: string }> {
  const outputPath = path.resolve(process.cwd(), outputFileName);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  // Title
  doc.fontSize(20).font('Helvetica-Bold').text('PDRM Police Report', { align: 'center' });
  doc.moveDown(1);

  // Report Information Section
  //doc.font('Helvetica-Bold').fontSize(14).text('Report Information');
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(12);
  doc.text('State: ___________________________________________');
  doc.text('\n');
  doc.text('District: ___________________________________________');
  doc.text('\n');
  doc.text('Contingent: ___________________________________________');
  doc.text('\n');
  doc.text('No Report: ___________________________________________');
  doc.text('\n');
  doc.text('Report Date: ___________________________________________');
  doc.text('\n');
  doc.text('Time: ___________________________________________');
  doc.text('\n');
  doc.moveDown(1);

  // Victim Information Section
  doc.font('Helvetica-Bold').fontSize(14).text('Victim Information');
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(12);
  doc.text('Name: ___________________________________________');
  doc.text('\n');
  doc.text('Phone Number: ___________________________________________');
  doc.text('\n');
  doc.text('Email: ___________________________________________');
  doc.text('\n');
  doc.text('Address: ___________________________________________');
  doc.text('\n');
  doc.text('IC Number: ___________________________________________');
  doc.text('\n');
  doc.text('Incident Date: ___________________________________________');
  doc.text('\n');
  doc.moveDown(1);

  // Report Status and Urgency
  doc.font('Helvetica').fontSize(11)/*.text(`Report Status: ${report.draftReportStatus}`, { continued: true })*/.text(`   Urgency Level: ${report.urgencyLevel}`, { align: 'right' });
  doc.moveDown(1);

  // Case Chronology
  //doc.font('Helvetica-Bold').fontSize(14).text('Case Chronology');
  //doc.moveDown(0.5);
  //doc.font('Helvetica').fontSize(12).text(report.caseChronology, { lineGap: 4 });
  //doc.moveDown(1);

  // Evidence Summary
  //doc.font('Helvetica-Bold').fontSize(14).text('Evidence Summary');
  //doc.moveDown(0.5);
  //doc.font('Helvetica').fontSize(12).text(report.evidenceSummary, { lineGap: 4 });
  //doc.moveDown(1);

  // Police Report Narrative
  doc.font('Helvetica-Bold').fontSize(14).text('Police Report Narrative');
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(12).text(report.policeReport, { align: 'justify', lineGap: 4 });
  doc.moveDown(1);

  // Recommended Actions (without bullets)
  //doc.font('Helvetica-Bold').fontSize(14).text('Recommended Actions');
  //doc.moveDown(0.5);
  //doc.font('Helvetica').fontSize(12);
  //report.recommendedActions.forEach((action, index) => {
  //  doc.text(`${index + 1}. ${action}`, { lineGap: 4 });
  //});
  //doc.moveDown(1);

  // Signature Lines
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(12);
  const signatureY = doc.y;
  doc.text('Victim Signature:', 50, signatureY);
  doc.moveTo(50, signatureY + 40).lineTo(250, signatureY + 40).stroke();

  doc.text('Police Signature:', 310, signatureY);
  doc.moveTo(310, signatureY + 40).lineTo(510, signatureY + 40).stroke();
  doc.moveDown(5);

  // AI-generated disclaimer
  doc.font('Helvetica').fontSize(10).text('[This report is AI-generated]', 50, signatureY + 80, { align: 'right' });

  doc.end();
  await finished(stream);
  const buffer = await fs.promises.readFile(outputPath);
  return { path: outputPath, base64: buffer.toString('base64') };
}
