import nodemailer from 'nodemailer';
import type { ScamAnalysis } from '../agents/scamAnalyst.js';

export async function sendBnmEmail(bankAccounts: string[], scamDetails: ScamAnalysis, recipientEmails: string[] = []) {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_APP_PASSWORD;

    if (!emailUser || !emailPass) {
      console.warn('⚠️ EMAIL_USER or EMAIL_APP_PASSWORD not set in .env. Skipping email notification.');
      return;
    }

    // Always include rickytan5350@gmail.com as per your specific requirement
    const targetRecipients = new Set([...recipientEmails, 'rickytan5350@gmail.com']);
    const recipientList = Array.from(targetRecipients).join(', ');

    console.log(`🤖 AUTOMATIC ACTION: Sending scam report to ${recipientList}`);

    // Create a transporter using Gmail SMTP (The working method)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const subject = `🚨 AUTO-ALERT: Scam Bank Account Detected - ${bankAccounts.join(', ')}`;
    
    const emailBody = [
      `Secure Digital Shield AI - AUTOMATED INCIDENT REPORT`,
      `--------------------------------------------------`,
      `This is an automated alert triggered because a scam bank account was detected.`,
      ``,
      `🏦 DETECTED SCAMMER ACCOUNTS:`,
      `[ ${bankAccounts.join(', ')} ]`,
      ``,
      `📊 AI ANALYSIS SUMMARY:`,
      `Scam Probability: ${scamDetails.scamProbability}%`,
      `Detected Patterns: ${scamDetails.detectedPatterns.join(', ')}`,
      `Justification: ${scamDetails.justification}`,
      ``,
      `Recommendation: Immediate investigation and blocking of these accounts by financial institutions.`,
      ``,
      `Regards,`,
      `Secure Digital Shield AI (Automated Bot)`
    ].join('\n');

    const mailOptions = {
      from: emailUser,
      to: recipientList,
      subject: subject,
      text: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ AUTOMATIC EMAIL SENT:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ AUTOMATIC EMAIL FAILED:', error);
  }
}
