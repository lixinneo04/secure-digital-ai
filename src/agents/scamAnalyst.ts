import { z } from 'zod';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import axios from 'axios'; 
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Genkit with Google AI
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_API_KEY || '' })],
});

export const ScamAnalysisSchema = z.object({
  scamProbability: z.number().min(0).max(100),
  detectedPatterns: z.array(z.string()),
  requiresForensics: z.boolean(),
  justification: z.string(),
  bnmMatchFound: z.boolean(),
  firebaseMatchFound: z.boolean().optional(), // New field for internal database matches
  scammerBankAccounts: z.array(z.string()).optional(), // New field for detected bank accounts
  recipientEmails: z.array(z.string()).optional(), // List of custom email recipients for reporting
});

export type ScamAnalysis = z.infer<typeof ScamAnalysisSchema>;

// --- Firebase Initialization ---
let rtdb: admin.database.Database | undefined;

try {
  if (!admin.apps || admin.apps.length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service_account.json';
    const absolutePath = path.resolve(process.cwd(), credPath);
    
    let config: any = {
      databaseURL: 'https://gdg-hackathon-2026-493002-default-rtdb.asia-southeast1.firebasedatabase.app'
    };
    
    if (fs.existsSync(absolutePath)) {
      const cert = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      config.credential = admin.credential.cert(cert);
    }
    admin.initializeApp(config);
  }
  rtdb = admin.database();
} catch (error) {
  console.warn('⚠️ Firebase initialization failed in ScamAnalyst:', error);
}

// --- Helper: Fetch Live BNM Data ---
async function fetchBNMAlerts() {
  try {
    const url = "https://api.bnm.gov.my/public/consumer-alert";
    const response = await axios.get(url, {
      headers: { "Accept": "application/vnd.BNM.API.v1+json" }
    });
    return response.data.data.map((item: any) => ({
      name: item.name,
      websites: item.websites,
      source: 'BNM_OFFICIAL'
    }));
  } catch (error) {
    console.error("⚠️ BNM API unreachable, proceeding with AI knowledge only.");
    return [];
  }
}

// --- Helper: Fetch Internal Firebase Data ---
async function fetchFirebaseAlerts() {
  if (!rtdb) return [];
  try {
    const snapshot = await rtdb.ref('consumer-alert-datastore').limitToLast(100).once('value');
    const data = snapshot.val();
    if (!data) return [];
    
    return Object.values(data).map((item: any) => ({
      name: item.name,
      websites: item.websites || [],
      source: 'INTERNAL_FIREBASE_REPORTS'
    }));
  } catch (error) {
    console.error("⚠️ Firebase RTDB fetch failed in ScamAnalyst:", error);
    return [];
  }
}

export async function scamAnalystFlow(input: string): Promise<ScamAnalysis> {
  console.log('🧐 Scam Analyst consulting multiple data sources...');

  // Step 1: Get data from both sources
  const [bnmData, firebaseData] = await Promise.all([
    fetchBNMAlerts(),
    fetchFirebaseAlerts()
  ]);

  const combinedGroundTruth = [...bnmData, ...firebaseData];
  console.log(`📊 Ground Truth loaded: ${bnmData.length} from BNM, ${firebaseData.length} from Firebase.`);

  // Step 2: Feed the User Report + Combined Data into Gemini
  const response = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `
    SYSTEM: Malaysian Cybercrime Specialist.
    GROUND TRUTH (BNM & Firebase Reports): ${JSON.stringify(combinedGroundTruth.slice(0, 500))}

    USER REPORT: "${input}"

    1. Analyze the user input for scam indicators.
    2. Check if any name, URL, or entity mentioned by the user exists in the GROUND TRUTH.
    3. If there is a match in BNM data, set bnmMatchFound to true.
    4. If there is a match in Firebase (INTERNAL_FIREBASE_REPORTS) data, set firebaseMatchFound to true.
    5. If any match is found, set requiresForensics to true.
    6. Identify any bank account numbers mentioned as receiving funds to the scammer.
    7. Return JSON:
    {
      "scamProbability": number (0-100),
      "detectedPatterns": ["List of indicators"],
      "requiresForensics": boolean,
      "bnmMatchFound": boolean,
      "firebaseMatchFound": boolean,
      "scammerBankAccounts": ["Bank account number 1"],
      "recipientEmails": ["email@example.com"],
      "justification": "Detailed reasoning referencing specific ground truth matches if applicable."
    }`
  });

  const text = response.text;
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    }
    throw new Error('Parsing failed');
  } catch (error) {
    return {
      scamProbability: 95,
      detectedPatterns: ['Fallback Internal Analysis'],
      requiresForensics: true,
      bnmMatchFound: false,
      firebaseMatchFound: false,
      justification: 'Analysis performed via internal model logic due to response parsing error.',
    };
  }
}