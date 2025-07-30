// YouTube Transcript Downloader Background Script
// Handles extension events and manages downloads

console.log('YouTube Transcript Downloader: Background script loaded');

// Simple transcript parser functions (embedded to avoid import issues)
function parseTranscript(transcriptData) {
    const parsedTranscript = transcriptData.map(entry => {
        return {
            start: entry.start,
            duration: entry.dur || 0,
            text: entry.text
        };
    });
    return parsedTranscript;
}

function formatTranscriptAsText(transcript) {
    return transcript.map(entry => `${entry.start} - ${entry.duration}: ${entry.text}`).join('\n');
}

function formatTranscriptAsJSON(transcript) {
    return JSON.stringify(transcript, null, 2);
}

chrome.runtime.onStartup.addListener(() => {
    console.log('YouTube Transcript Downloader: Background script startup');
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("YouTube Transcript Downloader Extension Installed");
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    if (request.action === 'downloadTranscript') {
        handleTranscriptDownload(request.transcript, request.videoInfo, request.format || 'text')
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'transcriptAvailable') {
        // Optionally update extension icon or badge when transcript is available
        chrome.action.setBadgeText({
            text: '✓',
            tabId: sender.tab?.id
        });
        chrome.action.setBadgeBackgroundColor({
            color: '#4CAF50',
            tabId: sender.tab?.id
        });
    }
});

// Function to handle transcript download
async function handleTranscriptDownload(transcriptData, videoInfo, format) {
    try {
        if (!transcriptData || transcriptData.length === 0) {
            throw new Error('No transcript data provided');
        }

        let content;
        let filename;
        let mimeType;

        console.log('Processing transcript data:', transcriptData.length, 'segments');

        // Parse and format transcript based on requested format
        const parsedTranscript = parseTranscript(transcriptData);

        if (format === 'json') {
            content = formatTranscriptAsJSON(parsedTranscript);
            filename = `${sanitizeFilename(videoInfo.title)}_transcript.json`;
            mimeType = 'application/json';
        } else {
            content = formatTranscriptAsText(parsedTranscript);
            filename = `${sanitizeFilename(videoInfo.title)}_transcript.txt`;
            mimeType = 'text/plain';
        }

        console.log('Generated content length:', content.length);

        // Create data URL for download (since URL.createObjectURL is not available in service worker)
        const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;

        return new Promise((resolve, reject) => {
            chrome.downloads.download({
                url: dataUrl,
                filename: filename,
                saveAs: true
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log("Download initiated with ID:", downloadId);
                    resolve({ success: true, downloadId: downloadId });
                }
            });
        });

    } catch (error) {
        console.error('Error handling transcript download:', error);
        throw error;
    }
}

// Utility function to sanitize filename
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 100); // Limit length
}

// Clean up badge when tab is updated (user navigates away from video)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.includes('youtube.com/watch')) {
        chrome.action.setBadgeText({
            text: '',
            tabId: tabId
        });
    }
});