# Cursor Deeplinks Everywhere

A Chrome extension that enables deeplink handling across all websites, allowing you to interact with custom URL schemes and app-specific links seamlessly.

## Features

- **Universal Deeplink Detection**: Automatically detects and handles custom URL schemes on any website
- **Text Selection Integration**: Select any text on a webpage and open it directly in Cursor as a prompt
- **Visual Indicators**: Shows hover tooltips for deeplinks and activation status
- **Smart Activation**: Can be activated per-page or globally
- **Custom Schemes**: Support for custom URL schemes beyond standard protocols
- **Context Menu**: Right-click on links or selected text to handle them
- **Keyboard Shortcuts**: Quick toggle functionality (Ctrl+Shift+D / Cmd+Shift+D)
- **Cursor Integration**: Seamlessly opens selected text in Cursor using deeplinks

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now appear in your extensions list

### Required Icons

The extension expects icon files in the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels) 
- `icon128.png` (128x128 pixels)

You can create simple placeholder icons or use any 16x16, 48x48, and 128x128 pixel images.

## Usage

### Basic Usage

1. Click the extension icon in your browser toolbar
2. Click "Activate on Current Page" to enable deeplink handling
3. Navigate to any page with deeplinks - they will be automatically detected and handled

### Text Selection & Cursor Integration

1. **Select Text**: Highlight any text on a webpage (code, documentation, prompts, etc.)
2. **Add Images**: Right-click on any image and select "Add Image to Selection"
3. **Automatic Detection**: A blue indicator will appear showing the selected content
4. **Open in Cursor**: Click "Open in Cursor" button or use the context menu
5. **Seamless Integration**: The text and images open as a pre-filled prompt in Cursor

### Features

- **Hover Detection**: Hover over links to see if they're deeplinks (shows "🔗 Deeplink" tooltip)
- **Automatic Handling**: Clicking deeplinks will attempt to open them with their respective apps
- **Status Indicator**: A blue indicator appears when deeplinks are active on a page
- **Context Menu**: Right-click any link or selected text to handle them
- **Text Selection**: Select any text and open it directly in Cursor as a prompt
- **Image Integration**: Right-click images to add them to your text selection with @ prefix
- **Keyboard Shortcuts**: Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to toggle deeplinks

### Settings

Access settings by clicking the "Settings" button in the popup (opens in a new tab).

Available settings:
- **Auto-activate**: Automatically enable deeplinks on new pages
- **Custom Schemes**: Add your own URL schemes to detect
- **Enable/Disable**: Toggle the extension on/off

## Supported Deeplink Patterns

The extension detects these types of deeplinks:

- Custom schemes: `app://`, `myapp://`, `custom://`, etc.
- Protocol-relative URLs with custom domains
- Any URL that doesn't match standard web protocols (http, https, mailto, tel)

## Development

### File Structure

```
cursor-deeplinks-everywhere/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── content.js             # Content script for page interaction
├── content.css            # Styles for content script
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

### Key Components

- **Manifest V3**: Uses the latest Chrome extension manifest format
- **Content Scripts**: Inject functionality into web pages
- **Background Service Worker**: Handles extension lifecycle and messaging
- **Popup Interface**: User interface for activation and settings

### Permissions

- `activeTab`: Access to the currently active tab
- `storage`: Save user settings and preferences
- `scripting`: Inject scripts into web pages
- `<all_urls>`: Access to all websites for universal deeplink detection

## Troubleshooting

### Extension Not Working

1. Check that Developer mode is enabled in `chrome://extensions/`
2. Ensure all required files are present
3. Check the browser console for error messages
4. Try reloading the extension

### Deeplinks Not Detected

1. Verify the link uses a custom scheme (not http/https)
2. Check that the extension is activated on the current page
3. Look for the blue "Deeplinks Active" indicator
4. Try right-clicking the link and selecting "Handle as Deeplink"

### Permission Issues

If you see permission errors:
1. Check that the extension has the required permissions
2. Try removing and re-adding the extension
3. Ensure you're using Manifest V3 format

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## License

This project is open source and available under the MIT License.
