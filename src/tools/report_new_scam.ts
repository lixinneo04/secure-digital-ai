import admin from 'firebase-admin';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Firebase Admin Initialization
let db: admin.database.Database | undefined;

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

  db = admin.database();
} catch (error) {
  console.warn('Firebase initialization warning:', error);
}

export const ReportScamInputSchema = z.object({
  name: z.string().describe('The name of the entity or scam'),
  registration_number: z.string().optional().default(''),
  websites: z.array(z.string()).describe('List of websites associated with the scam'),
});

export type ReportScamInput = z.infer<typeof ReportScamInputSchema>;

export async function reportNewScam(input: ReportScamInput): Promise<string> {
  try {
    if (!db) {
      throw new Error('Realtime Database not initialized.');
    }

    const newScam = {
      name: input.name,
      registration_number: input.registration_number || '',
      websites: input.websites,
      added_date: new Date().toISOString().split('T')[0],
      status: 'AI_DETECTED',
      verified: false,
    };

    // Use push() to add a new record with a unique key
    const newRef = db.ref('consumer-alert-datastore').push();
    await newRef.set(newScam);

    return `Successfully added "${input.name}" to the Realtime Database at /consumer-alert-datastore/${newRef.key}`;
  } catch (error: any) {
    console.error('Database Error Details:', error);
    throw new Error(`Could not save to database: ${error.message}`);
  }
}

export async function getScamCount(): Promise<number> {
  try {
    if (!db) {
      throw new Error('Realtime Database not initialized.');
    }
    const snapshot = await db.ref('consumer-alert-datastore').once('value');
    return snapshot.numChildren();
  } catch (error: any) {
    console.error('Failed to get database count:', error);
    return 0; // fallback in case DB is unreachable
  }
}
