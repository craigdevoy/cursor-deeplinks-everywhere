// Content script for Cursor Deeplinks Everywhere
console.log('Cursor Deeplinks Everywhere content script loaded');

// Initialize extension state
let selectedText = '';
let selectedImages = [];
let selectionRange = null;
let selectionTrackingEnabled = true;

// Load settings from storage on initialization
chrome.storage.sync.get(['selectionTrackingEnabled'], (result) => {
  selectionTrackingEnabled = result.selectionTrackingEnabled !== false; // Default to true
  console.log('Selection tracking loaded from storage:', selectionTrackingEnabled);
});

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSelectedText':
      sendResponse({ text: selectedText, images: selectedImages });
      break;
    case 'openInCursor':
      openSelectedTextInCursor(request.text || selectedText, request.images || selectedImages);
      sendResponse({ success: true });
      break;
    case 'addImageToSelection':
      addImageToSelection(request.imageUrl);
      sendResponse({ success: true });
      break;
    case 'toggleSelectionTracking':
      selectionTrackingEnabled = request.enabled;
      console.log('Selection tracking:', selectionTrackingEnabled ? 'enabled' : 'disabled');
      if (!selectionTrackingEnabled) {
        // Clear current selection when disabled
        selectedText = '';
        selectedImages = [];
        selectionRange = null;
      }
      sendResponse({ success: true });
      break;
    case 'getSelectionTrackingState':
      sendResponse({ enabled: selectionTrackingEnabled });
      break;
  }
});



// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50px;
    right: 10px;
    background: #ffc107;
    color: #000;
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    max-width: 300px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Track text selection
function trackTextSelection() {
  document.addEventListener('mouseup', () => {
    if (!selectionTrackingEnabled) return;
    
    const selection = window.getSelection();
      if (selection.toString().trim()) {
        selectedText = selection.toString().trim();
        selectionRange = selection.getRangeAt(0);
        console.log('Text selected:', selectedText);
      } else {
        selectedText = '';
        selectedImages = []; // Clear images when text selection is cleared
        selectionRange = null;
      }
  });
  
  // Also track keyboard selection
  document.addEventListener('keyup', (event) => {
    if (!selectionTrackingEnabled) return;
    
    if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Meta') {
      const selection = window.getSelection();
      if (selection.toString().trim()) {
        selectedText = selection.toString().trim();
        selectionRange = selection.getRangeAt(0);
      }
    }
  });
}


// Add image to current selection
function addImageToSelection(imageUrl) {
  if (!selectionTrackingEnabled) {
    showNotification('Selection tracking is disabled');
    return;
  }
  
  if (!selectedText) {
    showNotification('Please select text first, then add images');
    return;
  }
  
  // Check if image is already added
  if (selectedImages.includes(imageUrl)) {
    showNotification('Image already included in selection');
    return;
  }
  
  selectedImages.push(imageUrl);
  console.log('Image added to selection:', imageUrl);
  
  showNotification(`Image added to selection (${selectedImages.length} total)`);
}

// Open selected text in Cursor
function openSelectedTextInCursor(text, images = []) {
  if (!text && images.length === 0) {
    showNotification('No content selected');
    return;
  }
 
    // Generate Cursor deeplink with images
    const deeplink = generateCursorPromptDeeplink(text, images);
    
    // Create a temporary link element to handle the cursor:// protocol
    const link = document.createElement('a');
    link.href = deeplink;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Try to open the deeplink
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
}

// Generate Cursor prompt deeplink
function generateCursorPromptDeeplink(promptText, images = []) {
  // Use the cursor:// app link protocol
  let fullPrompt = promptText;
  
  if (images.length > 0) {
    // Add images with @ prefix
    const imageUrls = images.map(img => `@${img}`).join('\n');
    fullPrompt = `${promptText}\n\nImages:\n${imageUrls}`;
  }
  
  // Encode the prompt text for URL
  const encodedPrompt = encodeURIComponent(fullPrompt);
  
  // Return cursor:// protocol URL
  return `cursor://anysphere.cursor-deeplink/prompt?text=${encodedPrompt}`;
}

// Initialize text selection tracking
trackTextSelection();
