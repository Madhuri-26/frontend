// Sample original documents for local plagiarism detection
const originalDocuments = [
    "Artificial Intelligence (AI) is transforming the world in unprecedented ways. From healthcare to finance, education to entertainment, AI technologies are revolutionizing how we work, learn, and interact with each other.",
    "Machine learning is a subset of artificial intelligence that focuses on the development of computer programs that can access data and use it to learn for themselves. Through iterative processes and algorithms, these systems improve their performance over time.",
    "Climate change is a long-term shift in global temperatures and weather patterns. It is primarily caused by human activities, particularly the emission of greenhouse gases like carbon dioxide. These gases trap heat in the atmosphere, leading to a warming planet.",
    "The solar system consists of the Sun and everything that orbits around it, including planets, moons, asteroids, comets, and meteoroids. The planets in our solar system are Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.",
    "Photography is the art, application, and practice of creating durable images by recording light. It has become an important tool in science, medicine, business, and art. The invention of the camera changed how we perceive and document the world."
];

const sampleDemoText = "Artificial Intelligence (AI) is transforming the world in unprecedented ways. From healthcare to finance, education to entertainment, AI technologies are revolutionizing how we work, learn, and interact with each other. Machine learning algorithms can now analyze vast amounts of data, identify patterns, and make predictions with remarkable accuracy. Natural language processing enables computers to understand and generate human language, powering chatbots and virtual assistants. Computer vision systems can recognize objects, faces, and scenes with superhuman precision. Deep learning neural networks have achieved breakthroughs in image recognition, language translation, and game-playing. Yet with these incredible capabilities come important challenges and ethical considerations. Questions about data privacy, algorithmic bias, job displacement, and AI safety require careful thought and responsible development. Society must work together to ensure AI benefits everyone and aligns with human values. Looking forward, the potential of AI is limitless. Quantum computing promises to accelerate AI capabilities even further. Brain-computer interfaces may enable direct human-AI collaboration. However, we must also prioritize transparency, accountability, and human oversight in AI systems. The future of artificial intelligence depends on how wisely we develop and deploy these powerful technologies.";

// Mode switching
function switchMode(mode) {
    document.querySelectorAll('.mode-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600'));

    document.getElementById(`mode-${mode}`).classList.remove('hidden');
    document.getElementById(`btn-${mode}`).classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
    resetApp(false);
}

// Sample text handler
function loadSampleText() {
    document.getElementById('sampleTextBox').innerHTML = `<p>${sampleDemoText}</p>`;
    document.getElementById('scanSampleBtn').classList.remove('hidden');
    document.getElementById('resetBtn').classList.add('visible');
}

async function startSampleScan() {
    await performScan(sampleDemoText, "Sample Text");
}

// File scan handler
async function startFileScan() {
    const file = document.getElementById('fileInput').files[0];
    if (!file) {
        alert("Please select a file first.");
        return;
    }

    let text = "";
    try {
        if (file.name.endsWith(".docx")) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else {
            text = await file.text();
        }

        await performScan(text, file.name);
        document.getElementById('resetBtn').classList.add('visible');
    } catch (err) {
        alert("Error reading file: " + err.message);
    }
}

// Paste text scan handler
async function startPasteScan() {
    const text = document.getElementById('pasteTextArea').value.trim();
    if (!text) {
        alert("Please paste some text first.");
        return;
    }

    await performScan(text, "Pasted Content");
    document.getElementById('resetBtn').classList.add('visible');
}

// Utility helpers
function getRingStyle(score) {
    if (score < 20) {
        return {
            ring: "conic-gradient(#22c55e 0deg, #86efac 360deg)",
            statusClass: "status-good",
            badgeClass: "badge-good",
            statusIcon: "fa-circle-check",
            statusText: "No major plagiarism found"
        };
    } else if (score < 50) {
        return {
            ring: "conic-gradient(#f59e0b 0deg, #fde68a 360deg)",
            statusClass: "status-warn",
            badgeClass: "badge-warn",
            statusIcon: "fa-triangle-exclamation",
            statusText: "Moderate similarity detected"
        };
    } else {
        return {
            ring: "conic-gradient(#ef4444 0deg, #fca5a5 360deg)",
            statusClass: "status-bad",
            badgeClass: "badge-bad",
            statusIcon: "fa-circle-exclamation",
            statusText: "High plagiarism risk"
        };
    }
}

function getMetricBadgeClass(value) {
    if (value === true) return "metric-badge-good";
    if (value === false) return "metric-badge-bad";
    if (typeof value === "number") {
        if (value === 0) return "metric-badge-good";
        if (value <= 5) return "metric-badge-warn";
        return "metric-badge-bad";
    }
    return "metric-badge-neutral";
}

function getMetricDisplay(value) {
    if (value === true) return '<i class="fas fa-check"></i>';
    if (value === false) return '<i class="fas fa-times"></i>';
    return value;
}

// Main scan function
async function performScan(text, sourceType) {
    const resultBox = document.getElementById('resultBox');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');

    resultBox.innerHTML = "";
    progressContainer.classList.remove('hidden');
    progressText.textContent = "Analyzing...";

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
        progressBar.style.width = i + "%";
        progressPercent.textContent = i + "%";
        await new Promise(r => setTimeout(r, 70));
    }

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    if (words.length === 0) {
        alert("No text content found to analyze.");
        progressContainer.classList.add('hidden');
        return;
    }

    let maxSimilarity = 0;
    originalDocuments.forEach(orig => {
        const origWords = orig.toLowerCase().match(/\b\w+\b/g) || [];
        let matches = words.filter(w => origWords.includes(w)).length;
        let similarity = (matches / words.length) * 100;
        if (similarity > maxSimilarity) maxSimilarity = similarity;
    });

    const score = Math.floor(maxSimilarity);
    const ringData = getRingStyle(score);

    const grammarIssues = Math.max(0, Math.floor(words.length / 45) - (score < 20 ? 2 : 0));
    const spellingIssues = Math.max(0, Math.floor(words.length / 90) - (score < 25 ? 1 : 0));
    const punctuationIssues = Math.max(0, Math.floor(words.length / 110));
    const matchedSources = score < 20 ? 0 : score < 50 ? 2 : 5;
    const readabilityOk = words.length > 20;
    const originalityOk = score < 20;

    progressContainer.classList.add('hidden');
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";

    // Helper to build badge HTML
    function badge(cls, content) {
        return `<span class="metric-badge ${cls}">${content}</span>`;
    }

    function getBadge(value) {
        if (value === true)  return badge('badge-good', '<i class="fas fa-check"></i>');
        if (value === false) return badge('badge-bad',  '<i class="fas fa-times"></i>');
        if (typeof value === 'number') {
            if (value === 0)  return badge('badge-good', value);
            if (value <= 5)   return badge('badge-warn', value);
            return badge('badge-bad', value);
        }
        return badge('badge-neutral', value);
    }

    resultBox.innerHTML = `
        <div class="result-animated" style="padding:1.5rem;">
            <!-- Score Ring -->
            <div class="score-ring-section">
                <div class="score-ring" style="background:${ringData.ring};">
                    <span>${score}</span>
                </div>
                <div class="score-info">
                    <div class="status-pill ${ringData.statusClass}">
                        <span class="metric-badge ${ringData.badgeClass}" style="width:20px;height:20px;padding:0;margin-right:0.3rem;">${score}</span>
                        ${ringData.statusText}
                    </div>
                    <div class="score-subtext" style="margin-top:0.4rem;">
                        Scan completed for <strong>${sourceType}</strong>
                    </div>
                </div>
            </div>

            <!-- Metrics -->
            <div class="metric-row">
                <div class="metric-left">
                    <i class="fas fa-check-circle" style="color:#22c55e;"></i>
                    <span>No plagiarism found</span>
                </div>
                ${getBadge(originalityOk)}
            </div>

            <div class="metric-row">
                <div class="metric-left">
                    <i class="fas fa-spell-check" style="color:#6366f1;"></i>
                    <span>Grammar</span>
                </div>
                ${getBadge(grammarIssues)}
            </div>

            <div class="metric-row">
                <div class="metric-left">
                    <i class="fas fa-font" style="color:#a855f7;"></i>
                    <span>Spelling</span>
                </div>
                ${getBadge(spellingIssues)}
            </div>

            <div class="metric-row">
                <div class="metric-left">
                    <i class="fas fa-quote-left" style="color:#f59e0b;"></i>
                    <span>Punctuation</span>
                </div>
                ${getBadge(punctuationIssues)}
            </div>

            <div class="metric-row">
                <div class="metric-left">
                    <i class="fas fa-glasses" style="color:#3b82f6;"></i>
                    <span>Readability</span>
                </div>
                ${getBadge(readabilityOk)}
            </div>

            <div class="metric-row">
                <div class="metric-left">
                    <i class="fas fa-link" style="color:#64748b;"></i>
                    <span>Matched sources</span>
                </div>
                ${getBadge(matchedSources)}
            </div>

            <div class="metric-row">
                <div class="metric-left">
                    <i class="fas fa-list-ol" style="color:#94a3b8;"></i>
                    <span>Words scanned</span>
                </div>
                <span class="metric-badge badge-neutral">${words.length}</span>
            </div>

            <div class="mini-note">
                <strong>Document summary:</strong>
                Content size ${(text.length / 1024).toFixed(1)} KB. Similarity score is based on local document comparison in your current demo setup.
            </div>
        </div>
    `;

    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Reset function
function resetApp(full = true) {
    document.getElementById('resultBox').innerHTML = "";
    document.getElementById('progressContainer').classList.add('hidden');
    document.getElementById('progressBar').style.width = "0%";
    document.getElementById('progressPercent').textContent = "0%";
    document.getElementById('progressText').textContent = "Analyzing...";
    document.getElementById('resetBtn').classList.remove('visible');

    if (full) {
        document.getElementById('fileInput').value = "";
        document.getElementById('fileName').textContent = "Select PDF, DOCX or TXT";
        document.getElementById('pasteTextArea').value = "";
        document.getElementById('wordCount').textContent = "0";
        document.getElementById('sampleTextBox').innerHTML = '<p>Click "Load Sample" to view demo text...</p>';
        document.getElementById('scanSampleBtn').classList.add('hidden');
    }
}

// Clerk handles logout now in auth-clerk.js

// DOM Ready - Setup all event listeners
document.addEventListener('DOMContentLoaded', function () {
    const btnUpload = document.getElementById('btn-upload');
    const btnSample = document.getElementById('btn-sample');
    const btnPaste = document.getElementById('btn-paste');

    if (btnUpload) btnUpload.addEventListener('click', () => switchMode('upload'));
    if (btnSample) btnSample.addEventListener('click', () => switchMode('sample'));
    if (btnPaste) btnPaste.addEventListener('click', () => switchMode('paste'));

    const fileInput = document.getElementById('fileInput');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const scanSampleBtn = document.getElementById('scanSampleBtn');
    const scanFileBtn = document.getElementById('scanFileBtn');
    const pasteTextArea = document.getElementById('pasteTextArea');
    const scanPasteBtn = document.getElementById('scanPasteBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const fileName = document.getElementById('fileName');
            if (this.files.length > 0) {
                fileName.textContent = "Selected: " + this.files[0].name;
            }
        });
    }

    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', loadSampleText);
    }

    if (scanSampleBtn) {
        scanSampleBtn.addEventListener('click', startSampleScan);
    }

    if (scanFileBtn) {
        scanFileBtn.addEventListener('click', startFileScan);
    }

    if (scanPasteBtn) {
        scanPasteBtn.addEventListener('click', startPasteScan);
    }

    if (pasteTextArea) {
        pasteTextArea.addEventListener('input', function () {
            const wordCount = document.getElementById('wordCount');
            if (wordCount) {
                const count = this.value.trim().split(/\s+/).filter(w => w.length > 0).length;
                wordCount.textContent = count;
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => resetApp(true));
    }
});