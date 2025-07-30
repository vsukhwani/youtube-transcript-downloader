function parseTranscript(transcriptData) {
    const parsedTranscript = transcriptData.map(entry => {
        return {
            start: entry.start,
            duration: entry.dur,
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

export { parseTranscript, formatTranscriptAsText, formatTranscriptAsJSON };