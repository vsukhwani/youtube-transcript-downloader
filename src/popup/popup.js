// YouTube Transcript Downloader Popup Script

document.addEventListener('DOMContentLoaded', function () {
    const statusDiv = document.getElementById('status');
    const videoInfoDiv = document.getElementById('video-info');
    const controlsDiv = document.getElementById('controls');
    const errorDiv = document.getElementById('error');
    const downloadButton = document.getElementById('download-btn');
    const formatSelect = document.getElementById('format-select');
    const videoTitle = document.getElementById('video-title');
    const videoUrl = document.getElementById('video-url');
    const errorMessage = document.getElementById('error-message');
    const buttonText = document.querySelector('.button-text');
    const loadingText = document.querySelector('.loading');
    const debugBtn = document.getElementById('debug-btn');
    const debugOutput = document.getElementById('debug-output');
    const autoOpenBtn = document.getElementById('auto-open-btn');

    let currentTranscript = null;
    let currentVideoInfo = null;

    // Check if we're on a YouTube video page and can extract transcript
    async function checkYouTubePage() {
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('youtube.com/watch')) {
                showError('Please navigate to a YouTube video page first.');
                return;
            }

            // Try to extract transcript from the current page
            statusDiv.innerHTML = '<p>Checking for transcript...</p>';
            
            chrome.tabs.sendMessage(tab.id, { action: 'extractTranscript' }, (response) => {
                if (chrome.runtime.lastError) {
                    showError('Unable to connect to YouTube page. Please refresh the page and try again.');
                    return;
                }

                if (response && response.success) {
                    if (response.transcript && response.transcript.length > 0) {
                        currentTranscript = response.transcript;
                        currentVideoInfo = response.videoInfo;
                        showSuccess();
                    } else {
                        showError('No transcript found. Please enable captions/transcript on the YouTube video and try again.');
                    }
                } else {
                    showError(response?.error || 'Failed to extract transcript. Make sure the transcript panel is open.');
                }
            });

        } catch (error) {
            showError('Error: ' + error.message);
        }
    }

    function showSuccess() {
        statusDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        videoInfoDiv.style.display = 'block';
        controlsDiv.style.display = 'block';

        // Display video information
        videoTitle.textContent = currentVideoInfo.title;
        videoUrl.textContent = currentVideoInfo.url;
        
        // Update status
        statusDiv.innerHTML = `<p style="color: green;">✓ Found ${currentTranscript.length} transcript segments</p>`;
        statusDiv.style.display = 'block';
    }

    function showError(message) {
        statusDiv.style.display = 'none';
        videoInfoDiv.style.display = 'none';
        controlsDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        errorMessage.textContent = message;
    }

    function setDownloadLoading(loading) {
        if (loading) {
            buttonText.style.display = 'none';
            loadingText.style.display = 'inline';
            downloadButton.disabled = true;
        } else {
            buttonText.style.display = 'inline';
            loadingText.style.display = 'none';
            downloadButton.disabled = false;
        }
    }

    // Handle download button click
    downloadButton.addEventListener('click', async function () {
        if (!currentTranscript || !currentVideoInfo) {
            showError('No transcript data available');
            return;
        }

        setDownloadLoading(true);

        try {
            const format = formatSelect.value;
            
            // Send download request to background script
            chrome.runtime.sendMessage({
                action: 'downloadTranscript',
                transcript: currentTranscript,
                videoInfo: currentVideoInfo,
                format: format
            }, (response) => {
                setDownloadLoading(false);
                
                if (response && response.success) {
                    // Show success message briefly
                    const originalText = buttonText.textContent;
                    buttonText.textContent = 'Downloaded!';
                    setTimeout(() => {
                        buttonText.textContent = originalText;
                    }, 2000);
                } else {
                    showError('Download failed: ' + (response?.error || 'Unknown error'));
                }
            });

        } catch (error) {
            setDownloadLoading(false);
            showError('Download error: ' + error.message);
        }
    });

    // Handle auto-open transcript button click
    if (autoOpenBtn) {
        autoOpenBtn.addEventListener('click', async function () {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                autoOpenBtn.textContent = 'Opening transcript...';
                autoOpenBtn.disabled = true;
                
                // First try to open the transcript panel
                chrome.tabs.sendMessage(tab.id, { action: 'openTranscript' }, (response) => {
                    setTimeout(() => {
                        // Then try to extract transcript
                        chrome.tabs.sendMessage(tab.id, { action: 'extractTranscript' }, (extractResponse) => {
                            autoOpenBtn.textContent = 'Try Auto-Open Transcript';
                            autoOpenBtn.disabled = false;
                            
                            if (extractResponse && extractResponse.success) {
                                currentTranscript = extractResponse.transcript;
                                currentVideoInfo = extractResponse.videoInfo;
                                showSuccess();
                            } else {
                                showError(extractResponse?.error || 'Auto-open failed. Please try manually opening the transcript.');
                            }
                        });
                    }, 2000); // Wait 2 seconds for transcript to load
                });
                
            } catch (error) {
                autoOpenBtn.textContent = 'Try Auto-Open Transcript';
                autoOpenBtn.disabled = false;
                showError('Auto-open error: ' + error.message);
            }
        });
    }

    // Handle debug button click
    if (debugBtn) {
        debugBtn.addEventListener('click', async function () {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                chrome.tabs.sendMessage(tab.id, { action: 'debugTranscript' }, (response) => {
                    if (response && response.success) {
                        debugOutput.style.display = 'block';
                        debugOutput.innerHTML = `
                            <h4>Debug Information:</h4>
                            <p><strong>URL:</strong> ${response.debugInfo.url}</p>
                            
                            <p><strong>Available Transcript Buttons:</strong></p>
                            <ul>
                                ${response.debugInfo.availableButtons.map(btn => 
                                    `<li>${btn.tagName} - "${btn.text}" (${btn.visible ? 'Visible' : 'Hidden'}) - aria: "${btn.ariaLabel}"</li>`
                                ).join('') || '<li>No transcript buttons found</li>'}
                            </ul>
                            
                            <p><strong>Possible Selectors Found:</strong></p>
                            <ul>
                                ${response.debugInfo.possibleSelectors.map(s => 
                                    `<li>${s.selector} (${s.count} elements) - "${s.sampleText?.substring(0, 50)}..."</li>`
                                ).join('') || '<li>No transcript selectors found</li>'}
                            </ul>
                            
                            <p><strong>Transcript Containers:</strong></p>
                            <ul>
                                ${response.debugInfo.transcriptElements.map(el => 
                                    `<li>${el.tagName}.${el.className} (${el.childCount} children) - "${el.textPreview?.substring(0, 50)}..."</li>`
                                ).join('') || '<li>No transcript containers found</li>'}
                            </ul>
                        `;
                    } else {
                        debugOutput.style.display = 'block';
                        debugOutput.innerHTML = '<p>Debug failed: Unable to analyze page</p>';
                    }
                });
            } catch (error) {
                debugOutput.style.display = 'block';
                debugOutput.innerHTML = `<p>Debug error: ${error.message}</p>`;
            }
        });
    }

    // Initialize popup
    checkYouTubePage();
});