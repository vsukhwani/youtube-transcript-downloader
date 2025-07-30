# YouTube Transcript Downloader Browser Extension

A browser extension that allows you to download transcripts from YouTube videos in both text and JSON formats.

## Features

- 🎯 Extract transcripts from YouTube videos
- 📄 Download in multiple formats (TXT, JSON)
- 🎨 Clean, intuitive popup interface
- ⚡ Fast and lightweight
- 🔒 No external APIs required

## Installation

### For Chrome:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the extension folder

### For Microsoft Edge:
1. Open Edge and navigate to `edge://extensions/`
2. Enable "Developer mode" in the left sidebar
3. Click "Load unpacked" and select the extension folder

The extension icon should appear in your browser toolbar.

## How to Use

1. **Navigate to a YouTube video** with captions/transcript available
2. **Enable the transcript** by clicking the "Show transcript" button below the video
3. **Click the extension icon** in your browser toolbar
4. **Select your preferred format** (Text or JSON)
5. **Click "Download Transcript"** to save the file

## Supported Formats

### Text Format (.txt)
```
0 - 0: Welcome to this video
5 - 0: Today we'll be discussing
10 - 0: How to build Chrome extensions
```

### JSON Format (.json)
```json
[
  {
    "start": 0,
    "duration": 0,
    "text": "Welcome to this video"
  },
  {
    "start": 5,
    "duration": 0,
    "text": "Today we'll be discussing"
  }
]
```

## Troubleshooting

### "No transcript found" error
- Make sure captions are enabled on the YouTube video
- Click the "Show transcript" button below the video player
- Some videos may not have transcripts available

### Extension not working
- Refresh the YouTube page and try again
- Check that you're on a `youtube.com/watch` URL
- Ensure the extension is enabled in your browser's extensions page
- Try reloading the extension

### Download not starting
- Check your browser's download settings
- Ensure the extension has download permissions

## Development

### Project Structure
```
youtube-transcript-downloader/
├── manifest.json              # Extension configuration
├── src/
│   ├── background/
│   │   └── background.js      # Background service worker
│   ├── content/
│   │   └── content.js         # Content script for YouTube pages
│   ├── popup/
│   │   ├── popup.html         # Extension popup UI
│   │   ├── popup.js           # Popup functionality
│   │   └── popup.css          # Popup styling
│   └── utils/
│       └── transcript-parser.js # Transcript parsing utilities
└── assets/
    └── icons/                 # Extension icons
```

### Testing

1. Load the extension in developer mode
2. Navigate to a YouTube video with transcript
3. Enable transcript on the video
4. Test the extension popup
5. Verify download functionality

## Permissions

- `activeTab`: Access to the current tab for transcript extraction
- `scripting`: Inject content scripts into YouTube pages
- `downloads`: Download transcript files
- `tabs`: Query active tab information

## Version History

- **v1.0**: Initial release with basic transcript download functionality

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.