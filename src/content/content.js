// YouTube Transcript Downloader Content Script
// Extracts transcript data from YouTube video pages

console.log('YouTube Transcript Downloader: Content script loaded');

// Function to wait for element to appear
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function check() {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            } else {
                setTimeout(check, 100);
            }
        }
        
        check();
    });
}

// Function to find and click the transcript button
async function openTranscriptPanel() {
    console.log('Attempting to open transcript panel...');
    
    // Wait for page to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 1: First, try to find and click the "...more" expand button
    console.log('Step 1: Looking for expand/more button...');
    const expandButtonSelectors = [
        'tp-yt-paper-button#expand[aria-disabled="false"]',
        'tp-yt-paper-button#expand',
        '#expand.button',
        'tp-yt-paper-button:contains("more")',
        'button:contains("more")',
        '.ytd-text-inline-expander tp-yt-paper-button',
        '[role="button"]:contains("more")'
    ];
    
    let expandButtonClicked = false;
    
    for (const expandSelector of expandButtonSelectors) {
        try {
            console.log(`Trying expand selector: ${expandSelector}`);
            
            let expandButton = null;
            
            if (expandSelector.includes('contains')) {
                // Search for buttons with "more" text
                const allButtons = document.querySelectorAll('tp-yt-paper-button, button, [role="button"]');
                for (const btn of allButtons) {
                    const text = btn.textContent || btn.innerText || '';
                    if (text.toLowerCase().includes('more') && text.includes('...')) {
                        expandButton = btn;
                        break;
                    }
                }
            } else {
                expandButton = document.querySelector(expandSelector);
            }
            
            if (expandButton && expandButton.offsetParent !== null) {
                console.log(`Found expand button with selector: ${expandSelector}`);
                console.log('Expand button text:', expandButton.textContent);
                console.log('Expand button id:', expandButton.id);
                
                // Scroll into view and click
                expandButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 500));
                
                expandButton.click();
                console.log('Clicked expand button');
                expandButtonClicked = true;
                
                // Wait for the expanded content to appear
                await new Promise(resolve => setTimeout(resolve, 1500));
                break;
            }
        } catch (error) {
            console.log(`Failed with expand selector ${expandSelector}:`, error);
        }
    }
    
    if (expandButtonClicked) {
        console.log('Expand button was clicked, now looking for transcript button...');
    } else {
        console.log('No expand button found or clicked, proceeding to look for transcript button...');
    }
    
    // Step 2: Now look for the transcript button (which should be visible after expanding)
    console.log('Step 2: Looking for transcript button...');
    const transcriptButtonSelectors = [
        // Exact selector from the DOM structure
        'button[aria-label="Show transcript"][aria-disabled="false"]',
        'button[aria-label="Show transcript"]',
        
        // Backup selectors with different variations
        'ytd-button-renderer button[aria-label="Show transcript"]',
        'yt-button-shape button[aria-label="Show transcript"]',
        
        // More general selectors
        'button[aria-label*="transcript" i]',
        'yt-button-shape[aria-label*="transcript" i]',
        '[role="button"][aria-label*="transcript" i]'
    ];
    
    // Try each transcript button selector
    for (const selector of transcriptButtonSelectors) {
        try {
            console.log(`Trying transcript selector: ${selector}`);
            
            const button = document.querySelector(selector);
            
            if (button && button.offsetParent !== null) { // Check if button is visible
                console.log(`Found transcript button with selector: ${selector}`);
                console.log('Button element:', button);
                console.log('Button text:', button.textContent);
                console.log('Button aria-label:', button.getAttribute('aria-label'));
                console.log('Button aria-disabled:', button.getAttribute('aria-disabled'));
                
                // Scroll button into view
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Try different click methods
                console.log('Attempting to click transcript button...');
                
                // Method 1: Direct click
                button.click();
                console.log('Clicked transcript button (method 1)');
                
                // Method 2: Dispatch click event as backup
                setTimeout(() => {
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    button.dispatchEvent(clickEvent);
                    console.log('Dispatched click event (method 2)');
                }, 100);
                
                // Wait for the panel to open
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Check if transcript panel is now visible
                const transcriptPanel = document.querySelector(
                    'ytd-transcript-renderer, #transcript, [class*="transcript"], ytd-transcript-segment-renderer'
                );
                
                if (transcriptPanel && transcriptPanel.offsetParent !== null) {
                    console.log('Transcript panel opened successfully');
                    return true;
                } else {
                    console.log('Transcript button clicked but panel not visible yet, waiting more...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const transcriptPanelRetry = document.querySelector(
                        'ytd-transcript-renderer, #transcript, [class*="transcript"], ytd-transcript-segment-renderer'
                    );
                    
                    if (transcriptPanelRetry && transcriptPanelRetry.offsetParent !== null) {
                        console.log('Transcript panel opened successfully after retry');
                        return true;
                    }
                }
            } else {
                console.log(`Transcript button not found or not visible for selector: ${selector}`);
            }
        } catch (error) {
            console.log(`Failed with transcript selector ${selector}:`, error);
        }
    }
    
    // Step 3: Manual search by walking through all buttons and checking aria-label
    console.log('Step 3: Trying manual button search...');
    try {
        const allButtons = document.querySelectorAll('button, [role="button"]');
        console.log(`Found ${allButtons.length} total buttons on page`);
        
        for (let i = 0; i < allButtons.length; i++) {
            const btn = allButtons[i];
            const ariaLabel = btn.getAttribute('aria-label');
            
            if (ariaLabel && ariaLabel.toLowerCase().includes('show transcript')) {
                console.log(`Found transcript button by manual search at index ${i}`);
                console.log('Button:', btn);
                console.log('Aria-label:', ariaLabel);
                
                if (btn.offsetParent !== null) {
                    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    btn.click();
                    console.log('Clicked transcript button (manual search)');
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const transcriptPanel = document.querySelector(
                        'ytd-transcript-renderer, #transcript, [class*="transcript"], ytd-transcript-segment-renderer'
                    );
                    
                    if (transcriptPanel && transcriptPanel.offsetParent !== null) {
                        console.log('Transcript panel opened successfully via manual search');
                        return true;
                    }
                }
            }
        }
    } catch (error) {
        console.log('Manual button search failed:', error);
    }
    
    // Step 4: Check if transcript is already available but hidden
    console.log('Step 4: Checking for existing transcript elements...');
    const existingTranscript = document.querySelectorAll('ytd-transcript-segment-renderer');
    if (existingTranscript.length > 0) {
        console.log(`Found ${existingTranscript.length} existing transcript segments`);
        return true;
    }
    
    console.log('Failed to open transcript panel with all strategies');
    return false;
}

// Function to extract transcript data from YouTube's transcript panel
async function extractTranscript() {
    try {
        console.log('Attempting to extract transcript...');
        
        // First, try to find existing transcript segments
        let transcriptSegments = [];
        
        // Strategy 1: Try ytd-transcript-segment-renderer (most common)
        transcriptSegments = document.querySelectorAll('ytd-transcript-segment-renderer');
        console.log(`Strategy 1 - Found ${transcriptSegments.length} segments with ytd-transcript-segment-renderer`);
        
        // If no transcript segments found, try to open the transcript panel
        if (transcriptSegments.length === 0) {
            console.log('No transcript segments found, attempting to open transcript panel...');
            const opened = await openTranscriptPanel();
            
            if (opened) {
                // Wait a bit more and try again
                await new Promise(resolve => setTimeout(resolve, 1500));
                transcriptSegments = document.querySelectorAll('ytd-transcript-segment-renderer');
                console.log(`After opening panel - Found ${transcriptSegments.length} segments`);
            }
        }
        
        // Strategy 2: Try alternative transcript selectors
        if (transcriptSegments.length === 0) {
            transcriptSegments = document.querySelectorAll('[role="button"][data-params*="transcript"], .transcript-segment, .cue-group .cue');
            console.log(`Strategy 2 - Found ${transcriptSegments.length} segments with alternative selectors`);
        }
        
        // Strategy 3: Try more generic selectors
        if (transcriptSegments.length === 0) {
            transcriptSegments = document.querySelectorAll('div[data-testid*="transcript"] [role="button"], .ytd-transcript-body-renderer [role="button"]');
            console.log(`Strategy 3 - Found ${transcriptSegments.length} segments with generic selectors`);
        }
        
        // Strategy 4: Look for any clickable transcript elements
        if (transcriptSegments.length === 0) {
            const transcriptContainer = document.querySelector('#transcript, [aria-label*="transcript" i], .ytd-transcript-renderer');
            if (transcriptContainer) {
                transcriptSegments = transcriptContainer.querySelectorAll('[role="button"], .segment, div[class*="segment"]');
                console.log(`Strategy 4 - Found ${transcriptSegments.length} segments in transcript container`);
            }
        }
        
        // Strategy 5: Extract from captions if available (fallback)
        if (transcriptSegments.length === 0) {
            console.log('Trying to extract from captions as fallback...');
            const captionElements = document.querySelectorAll('.ytp-caption-segment, .captions-text, .html5-captions-text');
            if (captionElements.length > 0) {
                console.log(`Found ${captionElements.length} caption elements`);
                // This would require more complex logic to extract timestamped captions
                throw new Error('Transcript panel not found. Please click "Show transcript" button below the video to enable transcript download.');
            }
        }
        
        if (transcriptSegments.length === 0) {
            // Check if captions are available but transcript panel isn't open
            const ccButton = document.querySelector('.ytp-subtitles-button, button[aria-label*="Captions" i]');
            if (ccButton && ccButton.getAttribute('aria-pressed') === 'true') {
                throw new Error('Captions are enabled but transcript panel is not open. Please click the "Show transcript" button below the video (it may be in the "More actions" menu).');
            } else {
                throw new Error('No transcript found. Please ensure the video has captions enabled and the transcript panel is open.');
            }
        }

        const transcriptData = Array.from(transcriptSegments).map((segment, index) => {
            let timestampText = '0:00';
            let text = '';
            
            // Try multiple ways to extract timestamp and text
            
            // Method 1: Standard ytd-transcript-segment-renderer structure
            let timestampElement = segment.querySelector('.segment-timestamp, [class*="timestamp"]');
            let textElement = segment.querySelector('.segment-text, [class*="text"]:not([class*="timestamp"])');
            
            // Method 2: Direct text content parsing
            if (!timestampElement || !textElement) {
                const segmentText = segment.textContent || segment.innerText || '';
                const timestampMatch = segmentText.match(/^(\d{1,2}:\d{2}(?::\d{2})?)/);
                if (timestampMatch) {
                    timestampText = timestampMatch[1];
                    text = segmentText.replace(timestampMatch[0], '').trim();
                } else {
                    // If no timestamp found, use segment text as-is
                    text = segmentText.trim();
                }
            } else {
                timestampText = timestampElement?.textContent?.trim() || '0:00';
                text = textElement?.textContent?.trim() || '';
            }
            
            // Method 3: Fallback - use all text content and try to parse
            if (!text) {
                const allText = segment.textContent || segment.innerText || '';
                // Try to separate timestamp from text
                const parts = allText.split(/(?<=\d:\d{2})\s+/);
                if (parts.length >= 2) {
                    timestampText = parts[0].trim();
                    text = parts.slice(1).join(' ').trim();
                } else {
                    text = allText.trim();
                }
            }
            
            // Convert timestamp to seconds
            const timeParts = timestampText.split(':').reverse();
            const seconds = timeParts.reduce((acc, part, index) => {
                return acc + (parseInt(part) || 0) * Math.pow(60, index);
            }, 0);

            console.log(`Segment ${index}: "${timestampText}" -> "${text}"`);

            return {
                start: seconds,
                dur: 0, // Duration not available from transcript panel
                text: text
            };
        }).filter(item => item.text.length > 0); // Filter out empty segments

        console.log(`Successfully extracted ${transcriptData.length} transcript segments`);
        return transcriptData;
    } catch (error) {
        console.error('Error extracting transcript:', error);
        return [];
    }
}

// Function to get video information
function getVideoInfo() {
    const videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim() || 'Unknown Title';
    const videoId = new URLSearchParams(window.location.search).get('v') || 'unknown';
    
    return {
        title: videoTitle,
        videoId: videoId,
        url: window.location.href
    };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'extractTranscript') {
        extractTranscript().then(transcript => {
            const videoInfo = getVideoInfo();
            
            sendResponse({
                success: true,
                transcript: transcript,
                videoInfo: videoInfo
            });
        }).catch(error => {
            console.error('Transcript extraction error:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        });
        
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'openTranscript') {
        openTranscriptPanel().then(success => {
            sendResponse({
                success: success,
                message: success ? 'Transcript panel opened' : 'Failed to open transcript panel'
            });
        }).catch(error => {
            sendResponse({
                success: false,
                error: error.message
            });
        });
        
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'debugTranscript') {
        // Debug function to help identify transcript elements
        const debugInfo = {
            url: window.location.href,
            transcriptElements: [],
            possibleSelectors: [],
            availableButtons: []
        };
        
        // Find all potential transcript-related elements
        const selectors = [
            'ytd-transcript-segment-renderer',
            '[role="button"][data-params*="transcript"]',
            '.transcript-segment',
            '.cue-group .cue',
            '#transcript [role="button"]',
            '.ytd-transcript-body-renderer [role="button"]',
            '*[class*="transcript"] [role="button"]',
            '*[aria-label*="transcript"] [role="button"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                debugInfo.possibleSelectors.push({
                    selector: selector,
                    count: elements.length,
                    sampleText: elements[0]?.textContent?.substring(0, 100)
                });
            }
        });
        
        // Check for transcript containers
        const containers = document.querySelectorAll('#transcript, .ytd-transcript-renderer, *[class*="transcript"]');
        containers.forEach((container, i) => {
            debugInfo.transcriptElements.push({
                index: i,
                tagName: container.tagName,
                className: container.className,
                id: container.id,
                childCount: container.children.length,
                textPreview: container.textContent?.substring(0, 200)
            });
        });
        
        // Find all buttons that might be transcript-related
        const allButtons = document.querySelectorAll('button, [role="button"], yt-button-shape');
        allButtons.forEach((btn, i) => {
            const text = btn.textContent || btn.innerText || '';
            const ariaLabel = btn.getAttribute('aria-label') || '';
            
            if (text.toLowerCase().includes('transcript') || 
                ariaLabel.toLowerCase().includes('transcript') ||
                text.toLowerCase().includes('show transcript')) {
                debugInfo.availableButtons.push({
                    index: i,
                    tagName: btn.tagName,
                    className: btn.className,
                    text: text.substring(0, 100),
                    ariaLabel: ariaLabel,
                    visible: btn.offsetParent !== null
                });
            }
        });
        
        console.log('Debug info:', debugInfo);
        sendResponse({ success: true, debugInfo: debugInfo });
        return true;
    }
});

// Auto-detect when on a video page and transcript is available
function checkTranscriptAvailability() {
    const transcriptButton = document.querySelector('button[aria-label*="transcript" i], button[aria-label*="Show transcript" i]');
    if (transcriptButton) {
        console.log('YouTube Transcript Downloader: Transcript button found');
        // Optionally notify background script that transcript is available
        chrome.runtime.sendMessage({ action: 'transcriptAvailable' });
    }
}

// Check for transcript availability when page loads and when navigation occurs
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkTranscriptAvailability);
} else {
    checkTranscriptAvailability();
}

// Monitor for navigation changes on YouTube (SPA navigation)
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(checkTranscriptAvailability, 1000); // Wait for page to load
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});