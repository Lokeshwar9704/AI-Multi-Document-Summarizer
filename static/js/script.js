document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const summaryOutput = document.getElementById('summaryOutput');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const uploadLink = document.getElementById('uploadLink');
    const fileInput = document.getElementById('fileInput');
    const wordCount = document.getElementById('wordCount');
    const sentenceCount = document.getElementById('sentenceCount');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const lengthSlider = document.querySelector('.slider');

    // Sidebar Buttons
    const btnRefresh = document.getElementById('btnRefresh');
    const btnHistory = document.getElementById('btnHistory');
    const btnSearch = document.getElementById('btnSearch');

    // New Element References
    const btnPlayVoice = document.getElementById('btnPlayVoice');
    const btnToggleChat = document.getElementById('btnToggleChat');
    const chatPanel = document.getElementById('chatPanel');
    const closeChat = document.getElementById('closeChat');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');

    // --- State ---
    let isProcessing = false;
    let currentDocId = null;
    let audioPlayer = null;

    // Exit early if not on the main dashboard
    if (!textInput || !summarizeBtn) return;

    // --- Helpers ---
    function updateStats() {
        const text = textInput.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        const sentences = text ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;

        wordCount.textContent = words;
        sentenceCount.textContent = sentences;

        if (text.length > 0) {
            pasteBtn.classList.add('hidden');
        } else {
            pasteBtn.classList.remove('hidden');
        }
    }

    function setBtnLoading(loading) {
        isProcessing = loading;
        const currentMode = document.querySelector('.mode-btn.active').dataset.mode;
        const buttonText = (currentMode === 'flowchart' || currentMode === 'smart_flowchart' || currentMode === 'mindmap') ? 'Draw Diagram' : 'Summarize';
        const processingText = (currentMode === 'flowchart' || currentMode === 'smart_flowchart' || currentMode === 'mindmap') ? 'Drawing...' : 'Summarizing...';

        if (loading) {
            summarizeBtn.disabled = true;
            summarizeBtn.innerHTML = `<span class="spinner"></span> ${processingText}`;
            summarizeBtn.classList.add('loading');
        } else {
            summarizeBtn.disabled = false;
            summarizeBtn.textContent = buttonText;
            summarizeBtn.classList.remove('loading');
        }
    }

    async function renderSummary(markdown) {
        // Setup title block to be captured in exports
        const docTitle = document.getElementById('summaryOutput').dataset.title || 'Summary';
        const titleBlock = `<div style="margin-bottom: 25px;"><h2 style="font-size: 1.8rem; font-weight: 800; color: #1e2d3b; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">${docTitle}</h2></div>`;
        
        let processedMarkdown = markdown;
        
        // Attempt to parse strictly formatted JSON mindmaps and convert them to renderable Mermaid maps
        try {
            let jsonText = markdown;
            const jsonMatch = markdown.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (jsonMatch) {
                jsonText = jsonMatch[1].trim();
            } else {
                const startIdx = markdown.indexOf('{');
                const endIdx = markdown.lastIndexOf('}');
                if (startIdx !== -1 && endIdx !== -1) {
                    jsonText = markdown.substring(startIdx, endIdx + 1);
                }
            }
            const jsonObj = JSON.parse(jsonText);
            
            if (jsonObj.main_topic && jsonObj.subtopics) {
                let mermaidCode = `mindmap\n  root(("${jsonObj.main_topic}"))\n`;
                jsonObj.subtopics.forEach((sub, i) => {
                    const safeTitle = sub.title ? sub.title.replace(/[()"]/g, '') : "Branch";
                    mermaidCode += `    sub${i}["${safeTitle}"]\n`;
                    if (sub.points && Array.isArray(sub.points)) {
                        sub.points.forEach((pt, j) => {
                            const safePt = pt ? pt.replace(/[()"]/g, '') : "";
                            mermaidCode += `      sub${i}_pt${j}("${safePt}")\n`;
                        });
                    }
                });
                
                // Overwrite the markdown renderer with the syntactically valid Mermaid format
                processedMarkdown = `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
            }
        } catch (e) {
            // Processing assumes standard markdown if JSON parsing fails silently
        }

        let finalHtml = titleBlock + marked.parse(processedMarkdown);
        summaryOutput.innerHTML = finalHtml;

        // Render Mermaid diagrams
        const mermaidBlocks = summaryOutput.querySelectorAll('code.language-mermaid');
        for (let block of mermaidBlocks) {
            const code = block.innerText;
            const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
            const parent = block.parentElement;

            try {
                const { svg } = await mermaid.render(id, code);
                const diagramDiv = document.createElement('div');
                diagramDiv.className = 'mermaid-container';
                diagramDiv.innerHTML = svg;
                parent.replaceWith(diagramDiv);
            } catch (err) {
                console.error('Mermaid render error:', err);
                block.innerHTML = '<span style="color: #ef4444;">Error rendering flowchart.</span>';
            }
        }

        if (window.renderMathInElement) {
            renderMathInElement(summaryOutput, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }
        // Update stats but for the summary
        const text = summaryOutput.innerText.trim();
        document.getElementById('wordCount').textContent = text ? text.split(/\s+/).length : 0;
        document.getElementById('sentenceCount').textContent = text ? text.split(/[.!?]+/).filter(Boolean).length : 0;
    }

    // --- Event Listeners ---

    textInput.addEventListener('input', updateStats);

    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            textInput.value = text;
            updateStats();
        } catch (err) {
            alert('Could not paste text. Please paste manually.');
        }
    });

    uploadLink.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }
        formData.append('mode', document.querySelector('.mode-btn.active').dataset.mode);
        formData.append('length', lengthSlider.value);

        setBtnLoading(true);
        summaryOutput.textContent = files.length > 1
            ? `Summarizing ${files.length} documents...`
            : 'Extracting text and summarizing...';

        try {
            const response = await fetch('/summarize', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            currentDocId = data.doc_id;
            document.getElementById('summaryOutput').dataset.title = data.title;
            
            await renderSummary(data.summary);
        } catch (err) {
            summaryOutput.innerHTML = `<span style="color: #ef4444;">Error: ${err.message}</span>`;
        } finally {
            setBtnLoading(false);
            fileInput.value = ''; // Reset
        }
    });

    summarizeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) {
            alert('Please enter some text or URL first.');
            return;
        }

        const isUrl = /^https?:\/\/[^\s]+$/.test(text);
        const endpoint = isUrl ? '/summarize-url' : '/summarize-text';

        const formData = new FormData();
        if (isUrl) {
            formData.append('url', text);
        } else {
            formData.append('text', text);
        }
        formData.append('mode', document.querySelector('.mode-btn.active').dataset.mode);
        formData.append('length', lengthSlider.value);

        setBtnLoading(true);
        summaryOutput.textContent = isUrl ? 'Fetching webpage and generating summary...' : 'Generating summary...';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            currentDocId = data.doc_id;
            document.getElementById('summaryOutput').dataset.title = data.title;
            
            if (data.source_url) {
                const sourceBadge = `<div style="margin-bottom: 20px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 0.9em; display: inline-block;">` +
                    `<i class="ph-bold ph-link" style="color: var(--primary-color); margin-right: 5px;"></i> ` +
                    `<strong>Source:</strong> <a href="${data.source_url}" target="_blank" style="color: var(--primary-color); text-decoration: underline;">${data.title}</a>` +
                    `</div>\n\n`;
                data.summary = sourceBadge + data.summary;
            }

            await renderSummary(data.summary);
        } catch (err) {
            summaryOutput.innerHTML = `<span style="color: #ef4444;">Error: ${err.message}</span>`;
        } finally {
            setBtnLoading(false);
        }
    });

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Change button text based on mode
            if (btn.dataset.mode === 'flowchart' || btn.dataset.mode === 'smart_flowchart' || btn.dataset.mode === 'mindmap') {
                summarizeBtn.textContent = 'Draw Diagram';
            } else {
                summarizeBtn.textContent = 'Summarize';
            }
        });
    });

    // --- Sidebar Actions ---
    btnRefresh.addEventListener('click', () => {
        textInput.value = '';
        summaryOutput.innerHTML = '';
        if (audioPlayer) { audioPlayer.pause(); btnPlayVoice.innerHTML = '<i class="ph-bold ph-speaker-high"></i>'; }
        updateStats();
    });

    // --- Modals & Actions ---
    const historyModal = document.getElementById('historyModal');
    const closeHistory = document.getElementById('closeHistory');
    const btnDownloadPDF = document.getElementById('btnDownloadPDF');
    const btnDownloadPNG = document.getElementById('btnDownloadPNG');
    const historyList = document.getElementById('historyList');

    function toggleModal(modal, active) {
        if (active) modal.classList.add('active');
        else modal.classList.remove('active');
    }

    async function loadHistory() {
        historyList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Loading history...</p>';
        try {
            const response = await fetch('/history');

            if (response.status === 401 || response.url.includes('/login')) {
                historyList.innerHTML = '<p style="color: #ef4444; text-align: center;">Please <a href="/login" style="color: var(--primary-color)">Login</a> to view your history.</p>';
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();

            if (data.length === 0) {
                historyList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No history found.</p>';
                return;
            }

            historyList.innerHTML = data.map(item => `
                <div class="history-item" data-id="${item.id}" data-summary="${encodeURIComponent(item.summary)}" data-title="${encodeURIComponent(item.title)}">
                    <div class="history-item-content">
                        <div class="history-item-header">
                            <span class="history-item-title">${item.title || 'Untitled'}</span>
                            <span class="history-item-date">${item.timestamp}</span>
                        </div>
                        <div class="history-item-summary">${item.summary.replace(/#/g, '').substring(0, 80)}...</div>
                    </div>
                    <div class="history-item-actions">
                        <button class="history-action-btn download" title="Download PDF">
                            <i class="ph-bold ph-file-pdf"></i>
                        </button>
                        <button class="history-action-btn delete" title="Delete">
                            <i class="ph-bold ph-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.history-item').forEach(item => {
                const content = item.querySelector('.history-item-content');
                const btnDelete = item.querySelector('.delete');
                const btnDownload = item.querySelector('.download');
                const id = item.dataset.id;
                const title = decodeURIComponent(item.dataset.title);
                const summary = decodeURIComponent(item.dataset.summary);

                content.addEventListener('click', async () => {
                    document.getElementById('summaryOutput').dataset.title = title;
                    await renderSummary(summary);
                    toggleModal(historyModal, false);
                });

                btnDelete.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!confirm('Are you sure you want to delete this history entry?')) return;

                    try {
                        const res = await fetch(`/delete-history/${id}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (data.success) {
                            item.remove();
                            if (historyList.children.length === 0) {
                                historyList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No history found.</p>';
                            }
                        } else {
                            alert('Delete failed: ' + data.error);
                        }
                    } catch (err) {
                        alert('Error deleting history');
                    }
                });

                btnDownload.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    // Load into summary dashboard first to ensure it's rendered correctly
                    await renderSummary(summary);
                    toggleModal(historyModal, false);
                    // Wait a moment for rendering (KaTeX)
                    setTimeout(() => {
                        btnDownloadPDF.click();
                    }, 500);
                });
            });
        } catch (err) {
            historyList.innerHTML = '<p style="color: #ef4444; text-align: center;">Failed to load history.</p>';
        }
    }

    btnHistory.addEventListener('click', () => {
        toggleModal(historyModal, true);
        loadHistory();
    });

    closeHistory.addEventListener('click', () => toggleModal(historyModal, false));

    btnDownloadPDF.addEventListener('click', () => {
        const element = document.getElementById('summaryOutput');
        if (!element.innerText.trim()) {
            alert('No summary available to download!');
            return;
        }

        const rawTitle = element.dataset.title || 'Summarization_Report';
        let safeTitle = rawTitle.replace(/[^a-zA-Z0-9_\-\ ]/g, '_');
        
        const userInput = prompt("Enter a title for your PDF download:", safeTitle);
        if (userInput === null) return; // User cancelled
        safeTitle = (userInput.trim() || safeTitle).replace(/[^a-zA-Z0-9_\-\ ]/g, '_');

        const opt = {
            margin: [0.5, 0.5],
            filename: `${safeTitle}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Delay slightly to ensure any final KaTeX adjustments are caught
        setTimeout(() => {
            html2pdf().set(opt).from(element).save();
        }, 300);
    });

    if (btnDownloadPNG) {
        btnDownloadPNG.addEventListener('click', () => {
            const element = document.getElementById('summaryOutput');
            if (!element.innerText.trim()) {
                alert('No summary available to download!');
                return;
            }

            const rawTitle = element.dataset.title || 'Flowchart_Export';
            let safeTitle = rawTitle.replace(/[^a-zA-Z0-9_\-\ ]/g, '_');
            
            const userInput = prompt("Enter a title for your PNG download:", safeTitle);
            if (userInput === null) return; // User cancelled
            safeTitle = (userInput.trim() || safeTitle).replace(/[^a-zA-Z0-9_\-\ ]/g, '_');

            html2canvas(element, { scale: 3, useCORS: true }).then(canvas => {
                const link = document.createElement('a');
                link.download = `${safeTitle}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        });
    }

    btnSearch.addEventListener('click', () => {
        alert('Search within documents feature is coming soon!');
    });

    // Voice Player and Chat Features
    btnPlayVoice.addEventListener('click', async () => {
        const text = summaryOutput.innerText.trim();
        if (!text) {
            alert('No summary available to play.');
            return;
        }
        
        if (audioPlayer && !audioPlayer.paused) {
            audioPlayer.pause();
            btnPlayVoice.innerHTML = '<i class="ph-bold ph-speaker-high"></i>';
            return;
        }

        const originalIcon = btnPlayVoice.innerHTML;
        btnPlayVoice.innerHTML = '<span class="spinner" style="border-top-color: var(--primary-color); width: 14px; height: 14px; margin: 0; box-sizing: border-box;"></span>';

        const formData = new FormData();
        formData.append('text', text);

        try {
            const res = await fetch('/generate-audio', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (audioPlayer) {
                audioPlayer.pause();
            }
            audioPlayer = new Audio(data.audio_base64);
            audioPlayer.play();
            btnPlayVoice.innerHTML = '<i class="ph-bold ph-pause"></i>';
            
            audioPlayer.onended = () => {
                btnPlayVoice.innerHTML = '<i class="ph-bold ph-speaker-high"></i>';
            };
        } catch (err) {
            alert('Error generating audio: ' + err.message);
            btnPlayVoice.innerHTML = originalIcon;
        }
    });

    btnToggleChat.addEventListener('click', () => {
        if (!currentDocId || currentDocId === -1) {
            alert('Please login and summarize a document first to activate Chat.');
            return;
        }
        chatPanel.classList.toggle('hidden');
    });

    closeChat.addEventListener('click', () => {
        chatPanel.classList.add('hidden');
    });

    async function sendChatMessage() {
        const query = chatInput.value.trim();
        if (!query) return;

        // Append user message
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-msg user';
        userMsg.innerText = query;
        chatMessages.appendChild(userMsg);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Append loading message
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg bot';
        botMsg.innerHTML = '<span class="spinner" style="border-top-color: var(--primary-color); border-right-color: var(--primary-color); width: 12px; height: 12px;"></span>';
        chatMessages.appendChild(botMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const formData = new FormData();
        formData.append('doc_id', currentDocId);
        formData.append('query', query);

        try {
            const res = await fetch('/chat', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            botMsg.innerHTML = marked.parse(data.answer);
            
            // Render Math in Chat if KaTeX is available
            if (window.renderMathInElement) {
                renderMathInElement(botMsg, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            }
        } catch (err) {
            botMsg.innerText = 'Error: ' + err.message;
            botMsg.style.color = '#ef4444';
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Initial stats
    updateStats();
});