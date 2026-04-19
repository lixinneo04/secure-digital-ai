import axios from 'axios';

export interface ScanResult {
  malicious: number;
  suspicious: number;
  totalEngines: number;
  verdict: string;
}

export async function scanAndReportUrl(targetUrl: string): Promise<ScanResult | null> {
  const API_KEY = process.env.VIRUSTOTAL_API_KEY;

  try {
    // Step 1: Submit the URL for scanning
    console.log(`📤 Submitting ${targetUrl} to VirusTotal...`);
    await axios.post(
      'https://www.virustotal.com/api/v3/urls',
      new URLSearchParams({ url: targetUrl }),
      {
        headers: {
          'x-apikey': API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Step 2: Retrieve the analysis results
    // VirusTotal requires a URL-safe Base64 string without padding
    const urlId = Buffer.from(targetUrl)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      {
        headers: { 'x-apikey': API_KEY }
      }
    );

    const stats = response.data.data.attributes.last_analysis_stats;
    
    const scanResult: ScanResult = {
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      totalEngines: stats.malicious + stats.suspicious + stats.harmless + stats.undetected,
      verdict: stats.malicious > 0 ? "🚨 MALICIOUS" : "✅ CLEAN"
    };

    console.log('✅ URL Scan Complete:', scanResult);
    return scanResult;

  } catch (error: any) {
    console.error('❌ Scanner Error:', error.response?.data || error.message);
    return null;
  }
}