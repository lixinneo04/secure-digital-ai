# SOFAR (Scam Online Forensic Agent Responder) 🛡️

## AI-Powered Protection for the Digital Malaysian Frontier

**SOFAR** is a premium, multi-agent AI system designed to protect Malaysians from evolving digital scams. By leveraging the power of **Genkit**, **Google Gemini**, and official data sources, it provides real-time analysis, digital forensics, and automated incident response during the "Golden Hour" of a scam.

### The Problem: The Rising Tide of Digital Fraud
In recent years, Malaysia has seen a dramatic surge in digital scams, ranging from sophisticated SMS phishing (Smishing) to complex bank account takeovers. A major hurdle in combating these crimes is the **"Golden Hour"**—the critical 60-minute window after a fraud occurs where funds can still be intercepted and frozen by financial institutions.

Current limitations include:
- **Delayed Reporting**: Victims often don't know who to contact or how to provide technical evidence.
- **Manual Verification**: Cross-referencing suspicious accounts against official lists (like BNM's Consumer Alert) is manual and time-consuming.
- **Fragmented Evidence**: Technical indicators like malicious URLs often vanish before they can be analyzed by forensic teams.

### The Solution: SOFAR
**SOFAR** is designed to automate the defense and reporting lifecycle. It acts as an intelligent first responder that:
- **Analyzes** scams in real-time using Genkit and Google Gemini.
- **Performs digital forensics** on technical indicators (URLs, account numbers).
- **Automates institutional reporting** to authorities like Bank Negara Malaysia (BNM) and PDRM during that critical Golden Hour.

## 🚀 Key Features

- **Multi-Agent Orchestration**: Three specialized AI agents working in harmony.
- **Official BNM Integration**: Cross-references reports against the Bank Negara Malaysia (BNM) Consumer Alert list.
- **VirusTotal Forensic Scan**: Automatically extracts technical indicators (URLs) and scans them for malicious intent.
- **Firebase Realtime Database**: Stores and checks historical scam data for proactive detection.
- **Automated PDRM Reporting**: Generates a formal police report narrative in Malay and provides a downloadable PDF.
- **Premium Dashboard**: A stunning, modern web interface with real-time progress tracking and glassmorphism aesthetics.

## 🏗️ System Architecture

```mermaid
graph TD
    User([User Input]) --> Orchestrator[Secure Digital Shield Orchestrator]
    
    subgraph "AI Brain (Genkit + Gemini)"
        Orchestrator --> SA[Scam Analyst]
        SA --> FS[Forensic Specialist]
        FS --> IR[Incident Responder]
    end
    
    subgraph "External Integrations"
        SA -- Queries --> BNM[BNM Official API]
        SA -- Queries --> RTDB[Firebase Realtime DB]
        FS -- Scans --> VT[VirusTotal API]
        IR -- Generates --> PDF[PDFKit - PDRM Report]
        IR -- Automated Email --> Email[BNM Action Email]
    end
    
    IR --> Dashboard([Web UI Dashboard])
```

### The Agents
1.  **Scam Analyst (The Gatekeeper)**: The first responder. It identifies patterns, cross-references with official lists (BNM & Firebase), and determines the probability of a scam.
2.  **Forensic Specialist (The Investigator)**: Triggered when technical indicators are found. It extracts URLs and technical evidence, performing deep analysis via VirusTotal.
3.  **Incident Responder (The Action Agent)**: The action agent. It crafts the police report narrative, generates the downloadable PDF, triggers automated BNM emails for high probability scams, and simulates critical actions like bank notifications.

## 🛠️ Technical Stack

- **AI Orchestration**: Genkit (Google's AI Framework)
- **Model**: Google Gemini 1.5 Flash
- **Backend**: Node.js, Express, TypeScript
- **Database**: Firebase Realtime Database & Firestore
- **Forensics/Integration**: VirusTotal API, Nodemailer
- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), JavaScript
- **PDF Generation**: PDFKit

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Firebase Project
- VirusTotal API Key
- Google AI (Gemini) API Key

### Configuration
Create a `.env` file in the root directory:

```env
GOOGLE_API_KEY="your-google-ai-key"
GOOGLE_APPLICATION_CREDENTIALS="service_account.json"
GOOGLE_CLOUD_PROJECT="your-project-id"
VIRUSTOTAL_API_KEY="your-vt-key"
```

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Place your Firebase `service_account.json` in the root folder.

3. Start the server:
   ```bash
   npm run server
   ```

## 🖥️ Usage

1. Open `http://localhost:3000` or deployment link below in your browser.
2. Paste a suspicious message, SMS, or narrative into the input field.
3. Click "INITIALIZE ANALYSIS".
4. Watch the AI agents perform the multi-step "Golden Hour" detection.
5. Download the generated PDRM report if a threat is confirmed.

## 📈 Market Viability & Impact
- **Socio-Economic Impact**: Contributes to reducing the RM millions lost annually to digital fraud.
- **Scalability**: Modular agent architecture allows easy integration with future data sources (e.g., e-Portal PDRM).
- **Institutional Alignment**: Provides a standardized data format compatible with the National Scam Response Centre (NSRC).

## 🔮 Future Roadmap
- **NSRC Direct Integration**: Automating API-level reporting directly to the NSRC.
- **Live Voice Analysis**: Extending the platform to listen to active phone calls (with permission) to identify scam scripts.
- **Advanced OCR**: Using Gemini's multimodal capabilities to analyze screenshots of scam conversations.

## 🌐 Deployment in Google Cloud Run

Deployment link: https://secure-digital-shield-934974207372.asia-southeast1.run.app

---
Built with ❤️ for the **GDG Hackathon 2026**.
🛡️ *Protecting the Digital Malaysian Frontier.*
