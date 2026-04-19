import { z } from 'zod';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { scanAndReportUrl } from '../tools/url_scanner.js';

// Initialize Genkit with Google AI
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_API_KEY || '' })],
});

export const URLScanDetailsSchema = z.object({
  url: z.string(),
  verdict: z.string(),
  malicious: z.number(),
  suspicious: z.number(),
  totalEngines: z.number(),
});

export const ForensicExtractionSchema = z.object({
  maliciousUrls: z.array(z.string()),
  visualRedFlags: z.array(z.string()),
  technicalEvidence: z.record(z.string(), z.string()),
  urlScanDetails: z.array(URLScanDetailsSchema).optional(),
});

export type ForensicExtraction = z.infer<typeof ForensicExtractionSchema>;
export type URLScanDetails = z.infer<typeof URLScanDetailsSchema>;

export interface ForensicInput {
  screenshotUrl?: string;
  extractedText: string;
}

// Function to scan URLs using the URL Scanner tool
async function scanMaliciousUrls(urls: string[], onProgress?: (msg: string) => void): Promise<URLScanDetails[]> {
  const scanResults: URLScanDetails[] = [];

  for (const url of urls) {
    try {
      if (onProgress) onProgress(`Scanning URL in VirusTotal: ${url}`);
      console.log(`🔗 Scanning URL with scanner tool: ${url}`);
      const result = await scanAndReportUrl(url);
      if (result) {
        scanResults.push({
          url,
          verdict: result.verdict,
          malicious: result.malicious,
          suspicious: result.suspicious,
          totalEngines: result.totalEngines,
        });
      }
    } catch (error) {
      console.error(`❌ Error scanning ${url}:`, error);
    }
  }

  return scanResults;
}

export async function forensicFlow(input: ForensicInput, onProgress?: (msg: string) => void): Promise<ForensicExtraction> {
  console.log('🔍 Forensic Specialist analyzing evidence...');

  const response = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `You are a digital forensics expert analyzing potential cybercrime evidence. Extract and analyze suspicious elements from this user report.

    User Report: "${input.extractedText}"

    CRITICAL: Return ONLY a valid JSON object with this EXACT structure. Do not include any other text, explanations, code blocks, or formatting. Just the raw JSON:

    {
      "maliciousUrls": ["https://suspicious-site.com"],
      "visualRedFlags": ["Fake logo", "Poor grammar"],
      "technicalEvidence": {"domain_age": "2 days", "ssl_valid": false}
    }

    Look for:
    - Suspicious URLs (shortened, misspelled domains, unusual TLDs)
    - Phone numbers, contact methods, or bank accounts (add to visualRedFlags)
    - Psychological tactics like high returns, urgency, or impersonation (add to visualRedFlags)
    - Technical indicators of phishing/malware
    - Domain analysis clues
    - SSL/certificate issues mentioned

    If no suspicious elements found, return empty arrays/objects.`
  });

  const text = response.text;
  console.log('🔬 Forensic raw response:', text);

  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const forensics = JSON.parse(jsonMatch[0]);
      console.log('🔬 Forensic findings:', forensics);

      // Step 2: Scan malicious URLs found in forensic analysis
      if (forensics.maliciousUrls && forensics.maliciousUrls.length > 0) {
        console.log('🔗 Scanning detected malicious URLs...');
        const urlScanDetails = await scanMaliciousUrls(forensics.maliciousUrls, onProgress);
        forensics.urlScanDetails = urlScanDetails;
        console.log('✅ URL scan details added to forensic report:', urlScanDetails);
      }

      return forensics;
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    console.log('⚠️ Failed to parse JSON, using fallback forensics');
    const fallbackForensics = {
      maliciousUrls: [''],
      visualRedFlags: [''],
      technicalEvidence: { domain_age: '', ssl_status: '' },
    };

    // Scan URLs in fallback forensics too
    const urlScanDetails = await scanMaliciousUrls(fallbackForensics.maliciousUrls, onProgress);

    return {
      ...fallbackForensics,
      urlScanDetails,
    };
  }
}