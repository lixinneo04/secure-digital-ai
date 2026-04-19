# SOFAR (Scam Online Forensic Agent Responder) 🛡️
## AI-Powered Protection for the Digital Malaysian Frontier

### 1. The Problem: The Rising Tide of Digital Fraud
In recent years, Malaysia has seen a dramatic surge in digital scams, ranging from sophisticated SMS phishing (Smishing) to complex bank account takeovers. A major hurdle in combating these crimes is the **"Golden Hour"**—the critical 60-minute window after a fraud occurs where funds can still be intercepted and frozen by financial institutions.

Current limitations include:
- **Delayed Reporting**: Victims often don't know who to contact or how to provide technical evidence.
- **Manual Verification**: Cross-references suspicious accounts against official lists (like BNM's Consumer Alert) is manual and time-consuming.
- **Fragmented Evidence**: Technical indicators like malicious URLs often vanish before they can be analyzed by forensic teams.

### 2. The Solution: Secure Digital Shield
**Secure Digital Shield** is a premium, multi-agent AI system designed to automate the defense and reporting lifecycle. It acts as an intelligent first responder that:
- **Analyzes** scams in real-time using Genkit and Google Gemini.
- **Performs digital forensics** on technical indicators (URLs, account numbers).
- **Automates institutional reporting** to authorities like Bank Negara Malaysia (BNM) and PDRM during that critical Golden Hour.

### 3. Technology Stack
The platform is built on a modern, high-performance stack optimized for speed and reliability:
- **AI Orchestration**: Google Genkit (Google's latest framework for building production AI).
- **Large Language Model**: Google Gemini 1.5 Flash (for high speed and low latency).
- **Backend**: Node.js, Express, TypeScript.
- **Data & Persistence**: Firebase Realtime Database & Firestore.
- **Forensic Integration**: VirusTotal API for malicious URL scanning.
- **Notification Services**: Nodemailer for automated bank/BNM email alerts.
- **Reporting Engine**: PDFKit for generating official PDRM-ready incident reports.
- **Frontend**: Vanilla HTML5/CSS3 with Glassmorphism aesthetics and Speech-to-Text capabilities.

### 4. Technical Architecture
The system employs a **Multi-Agent Design Pattern**, where three specialized AI agents collaborate to resolve an incident:

1.  **Scam Analyst (The Gatekeeper)**: Receives initial user input, identifies behavioral patterns, and cross-references data against the BNM Consumer Alert dataset and localized Firebase scam records.
2.  **Forensic Specialist (The Investigator)**: Triggered when technical evidence is found. It extracts URLs and performs sub-second scans via the VirusTotal API to confirm malicious intent.
3.  **Incident Responder (The Action Agent)**: Summarizes findings into a formal legal narrative, generates a downloadable PDRM police report in Malay, and prepares automated email notifications for relevant banks.

### 5. Market Viability & Impact
- **Socio-Economic Impact**: By shortening the time from detection to reporting, Secure Digital Shield directly contributes to reducing the RM millions lost annually to digital fraud in Malaysia.
- **Scalability**: The system's modular agent architecture allows for easy integration with future data sources (e.g., e-Portal PDRM, MCMC blacklists).
- **Institutional Alignment**: Provides a standardized data format that can be directly ingested by the National Scam Response Centre (NSRC).

### 6. Challenges
- **Adversarial AI**: Scammers are increasingly using AI to craft more convincing messages, requiring our models to stay one step ahead in pattern recognition.
- **Data Privacy**: Handling sensitive financial and personal data requires strict adherence to PDPA (Personal Data Protection Act) regulations and secure encryption.
- **Real-Time API Integration**: Maintaining low latency while querying multiple external APIs (BNM, VirusTotal, Banks) during a high-traffic attack.

### 7. Future Roadmap
- **NSRC Direct Integration**: Automating API-level reporting directly to the NSRC backend for sub-minute fund freezing.
- **Live Voice Analysis**: Extending the platform to listen to active phone calls (with user permission) to identify scam scripts in real-time.
- **Mobile App Extension**: A dedicated mobile application with background SMS scanning and real-time "Scam Flash" notifications.
- **Advanced OCR**: Using Gemini's multimodal capabilities to analyze screenshots of scam conversations or bank transfer receipts.

---
🛡️ *Protecting Malaysians, One Agent at a Time.*
Developed for **GDG Hackathon 2026**.
