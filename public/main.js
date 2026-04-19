document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const userInput = document.getElementById('userInput');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const resultsSection = document.getElementById('resultsSection');

    // Results elements
    const bnmMatchText = document.getElementById('bnmMatchText');
    const bnmStatus = document.getElementById('bnmStatus');
    const dbMatchText = document.getElementById('dbMatchText');
    const dbStatus = document.getElementById('dbStatus');
    const vtMatchText = document.getElementById('vtMatchText');
    const vtStatus = document.getElementById('vtStatus');
    const downloadPdf = document.getElementById('downloadPdf');

    const probText = document.getElementById('probText');
    const probCircle = document.getElementById('probCircle');
    const patternList = document.getElementById('patternList');
    const urlList = document.getElementById('urlList');
    const flagList = document.getElementById('flagList');
    const policeNarrative = document.getElementById('policeNarrative');
    const actionList = document.getElementById('actionList');
    const urgencyTag = document.getElementById('urgencyTag');

    // Input mode elements
    const narrativeModeBtn = document.getElementById('narrativeModeBtn');
    const guidedModeBtn = document.getElementById('guidedModeBtn');
    const narrativeContainer = document.getElementById('narrativeContainer');
    const guidedContainer = document.getElementById('guidedContainer');
    const micBtn = document.getElementById('micBtn');
    const micIcon = document.getElementById('micIcon');

    // Guided form fields
    const guideDate = document.getElementById('guideDate');
    const guideName = document.getElementById('guideName');
    const guideUrl = document.getElementById('guideUrl');
    const guideBank = document.getElementById('guideBank');
    const guideOther = document.getElementById('guideOther');

    let currentMode = 'narrative';

    // --- Mode Switching ---
    narrativeModeBtn.addEventListener('click', () => {
        currentMode = 'narrative';
        narrativeModeBtn.classList.add('active');
        guidedModeBtn.classList.remove('active');
        narrativeContainer.classList.remove('hidden');
        guidedContainer.classList.add('hidden');
    });

    guidedModeBtn.addEventListener('click', () => {
        currentMode = 'guided';
        guidedModeBtn.classList.add('active');
        narrativeModeBtn.classList.remove('active');
        guidedContainer.classList.remove('hidden');
        narrativeContainer.classList.add('hidden');
    });

    // --- Speech to Text ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let silenceTimer = null;
    const SILENCE_TIMEOUT = 3000;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-MY';

        const resetTimer = () => {
            if (silenceTimer) clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                console.log('🕒 3s silence - stopping automatically.');
                recognition.stop();
            }, SILENCE_TIMEOUT);
        };

        recognition.onstart = () => {
            micBtn.classList.add('listening');
            micIcon.className = 'fas fa-stop';
            console.log('🎤 Continuous listening started...');
            resetTimer();
        };

        recognition.onresult = (event) => {
            resetTimer();
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                userInput.value += (userInput.value ? ' ' : '') + finalTranscript;
            }
        };

        const cleanupUI = () => {
            micBtn.classList.remove('listening');
            micIcon.className = 'fas fa-microphone';
            if (silenceTimer) clearTimeout(silenceTimer);
        };

        recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            cleanupUI();
        };

        recognition.onend = cleanupUI;

        micBtn.addEventListener('click', () => {
            if (micBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Recognition error:', e);
                }
            }
        });
    } else {
        micBtn.addEventListener('click', () => {
            alert('⚠️ Web Speech API not supported in this browser.');
        });
    }

    // --- Analysis Initialization ---
    analyzeBtn.addEventListener('click', async () => {
        let input = '';

        if (currentMode === 'narrative') {
            input = userInput.value.trim();
        } else {
            // Assemble Guided Narrative
            const parts = [];
            if (guideDate.value) parts.push(`The incident occurred on ${guideDate.value}.`);
            if (guideName.value) parts.push(`The person/entity involved is named ${guideName.value}.`);
            if (guideUrl.value) parts.push(`The suspicious link provided is ${guideUrl.value}.`);
            if (guideBank.value) parts.push(`The scammer's bank account details are ${guideBank.value}.`);
            if (guideOther.value) parts.push(`Additional details: ${guideOther.value}`);

            input = parts.join(' ');
        }

        if (!input) {
            alert('Please provide some information about the scam.');
            return;
        }

        // Show loading
        loadingOverlay.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        loadingText.innerText = 'Consulting Malaysian Cybercrime Specialist Brain...';

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
            });

            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error(error);
            alert('System error during analysis. Please try again.');
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    });

    downloadPdf.addEventListener('click', () => {
        window.location.href = '/api/download-report';
    });

    function displayResults(data) {
        const { analysis, forensics, report } = data;

        // BNM Status Card
        if (analysis.bnmMatchFound) {
            bnmMatchText.innerText = 'SCAM MATCH FOUND';
            bnmStatus.classList.remove('no-match');
            bnmStatus.classList.add('match');
        } else {
            bnmMatchText.innerText = 'No match found';
            bnmStatus.classList.remove('match');
            bnmStatus.classList.add('no-match');
        }

        // DB Status Card
        if (analysis.firebaseMatchFound) {
            dbMatchText.innerText = 'PREVIOUS CASE MATCH';
            dbStatus.classList.remove('no-match');
            dbStatus.classList.add('match');
        } else {
            dbMatchText.innerText = 'No existing cases';
            dbStatus.classList.remove('match');
            dbStatus.classList.add('no-match');
        }

        // VirusTotal Status Card
        if (forensics.urlScanDetails && forensics.urlScanDetails.length > 0) {
            const scan = forensics.urlScanDetails[0];
            if (scan.malicious > 0 || scan.suspicious > 0) {
                vtMatchText.innerText = `MALICIOUS (${scan.malicious} detections)`;
                vtStatus.classList.remove('no-match');
                vtStatus.classList.add('match');
            } else {
                vtMatchText.innerText = 'URL Scanned: CLEAN';
                vtStatus.classList.remove('match');
                vtStatus.classList.add('no-match');
            }
        } else {
            vtMatchText.innerText = 'the link is not found in VirusTotal';
            vtStatus.classList.remove('match', 'no-match');
        }

        // Scam Analyst Results
        probText.innerText = `${analysis.scamProbability}%`;
        const dashArray = `${analysis.scamProbability}, 100`;
        probCircle.setAttribute('stroke-dasharray', dashArray);

        const chart = document.querySelector('.circular-chart');
        chart.classList.remove('low', 'high', 'critical');
        if (analysis.scamProbability > 80) chart.classList.add('critical');
        else if (analysis.scamProbability > 50) chart.classList.add('high');
        else chart.classList.add('low');

        patternList.innerHTML = analysis.detectedPatterns.map(p => `<li>${p}</li>`).join('');

        // Forensic Results
        urlList.innerHTML = forensics.maliciousUrls.map(url => `<span class="tag-url">${url}</span>`).join('');
        flagList.innerHTML = forensics.visualRedFlags.map(flag => `<li>${flag}</li>`).join('');

        // Report Results
        policeNarrative.innerText = report.policeReport;
        actionList.innerHTML = report.recommendedActions.map(a => `<li>${a}</li>`).join('');
        urgencyTag.innerText = `${report.urgencyLevel} Urgency`;

        // Show results with animation
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
});
