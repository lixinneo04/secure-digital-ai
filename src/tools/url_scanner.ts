import axios from 'axios';

export interface ScanResult {
  malicious: number;
  suspicious: number;
  totalEngines: number;
  verdict: string;
}

export async function scanAndReportUrl(targetUrl: string): Promise<ScanResult | null> {
  const API_KEY = process.env.VIRUSTOTAL_API_KEY;

  // Clean URL
  targetUrl = targetUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'http://' + targetUrl;
  }

  try {
    console.log(`📤 Submitting ${targetUrl} to VirusTotal...`);
    const postRes = await axios.post(
      'https://www.virustotal.com/api/v3/urls',
      new URLSearchParams({ url: targetUrl }),
      {
        headers: {
          'x-apikey': API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const analysisId = postRes.data.data.id;
    console.log(`⏳ VirusTotal Analysis ID generated: ${analysisId}. Verifying result...`);

    // Poll the analysis endpoint. Sometimes VirusTotal takes a few seconds to scan fresh links
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await axios.get(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        { headers: { 'x-apikey': API_KEY } }
      );

      const status = response.data.data.attributes.status;
      if (status === 'completed') {
        const stats = response.data.data.attributes.stats;
        const scanResult: ScanResult = {
          malicious: stats.malicious,
          suspicious: stats.suspicious,
          totalEngines: stats.malicious + stats.suspicious + stats.harmless + stats.undetected,
          verdict: stats.malicious > 0 ? "🚨 MALICIOUS" : "✅ CLEAN"
        };
        console.log('✅ URL Scan Complete:', scanResult);
        return scanResult;
      }
    }

    // Fallback if not complete: Look up existing URL record safely using base64id
    const urlId = Buffer.from(targetUrl)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const fallbackResponse = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      { headers: { 'x-apikey': API_KEY } }
    );

    const fallbackStats = fallbackResponse.data.data.attributes.last_analysis_stats;
    const scanResult: ScanResult = {
      malicious: fallbackStats.malicious,
      suspicious: fallbackStats.suspicious,
      totalEngines: fallbackStats.malicious + fallbackStats.suspicious + fallbackStats.harmless + fallbackStats.undetected,
      verdict: fallbackStats.malicious > 0 ? "🚨 MALICIOUS" : "✅ CLEAN"
    };
    return scanResult;

  } catch (error: any) {
    console.error('❌ Scanner Error:', error.response?.data || error.message);
    return null;
  }
}