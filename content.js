// Content script for Cursor Deeplinks Everywhere
console.log('Cursor Deeplinks Everywhere content script loaded');

// Initialize extension state
let selectedText = '';
let selectedImages = [];
let selectionRange = null;
let selectionTrackingEnabled = true;

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
        // Clear current selection and hide indicators when disabled
        selectedText = '';
        selectedImages = [];
        selectionRange = null;
        hideSelectionIndicator();
      }
      sendResponse({ success: true });
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
      
      // Show selection indicator
      showSelectionIndicator();
    } else {
      selectedText = '';
      selectedImages = []; // Clear images when text selection is cleared
      selectionRange = null;
      hideSelectionIndicator();
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
        showSelectionIndicator();
      }
    }
  });
}

// Show selection indicator with Cursor action
function showSelectionIndicator() {
  hideSelectionIndicator(); // Remove any existing indicator
  
  if (!selectedText) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'cursor-text-selection-indicator';
  indicator.style.cssText = `
    position: fixed;
    background: #007bff;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 10002;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    cursor: pointer;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  // Build images display
  let imagesDisplay = '';
  if (selectedImages.length > 0) {
    imagesDisplay = `
      <div style="margin-bottom: 8px; font-size: 11px; opacity: 0.8;">
        📷 ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} included
      </div>
    `;
  }

  indicator.innerHTML = `
    <div style="margin-bottom: 4px; font-weight: bold;">📝 Selected Content</div>
    <div style="margin-bottom: 8px; opacity: 0.9; max-height: 60px; overflow: hidden;">${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}</div>
    ${imagesDisplay}
    <button id="openInCursorBtn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">Open in Cursor</button>
  `;
  
  // Position near selection
  if (selectionRange) {
    const rect = selectionRange.getBoundingClientRect();
    indicator.style.top = `${rect.bottom + window.scrollY + 10}px`;
    indicator.style.left = `${rect.left + window.scrollX}px`;
  } else {
    indicator.style.top = '100px';
    indicator.style.right = '20px';
  }
  
  document.body.appendChild(indicator);
  
  // Add click handler
  document.getElementById('openInCursorBtn').addEventListener('click', () => {
    openSelectedTextInCursor(selectedText);
  });
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideSelectionIndicator();
  }, 5000);
}

// Hide selection indicator
function hideSelectionIndicator() {
  const indicator = document.getElementById('cursor-text-selection-indicator');
  if (indicator) {
    indicator.remove();
  }
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
  
  // Update the selection indicator
  showSelectionIndicator();
  
  showNotification(`Image added to selection (${selectedImages.length} total)`);
}

// Open selected text in Cursor
function openSelectedTextInCursor(text, images = []) {
  if (!text && images.length === 0) {
    showNotification('No content selected');
    return;
  }
  
  try {
    // Generate Cursor deeplink with images
    const deeplink = generateCursorPromptDeeplink(text, images);
    
    // Try to open the deeplink
    window.location.href = deeplink;
    
    showNotification('Opening in Cursor...');
    hideSelectionIndicator();
  } catch (error) {
    console.error('Error opening in Cursor:', error);
    showNotification('Error opening in Cursor', 'error');
  }
}

// Generate Cursor prompt deeplink
function generateCursorPromptDeeplink(promptText, images = []) {
  // Use the web format for better browser compatibility
  const url = new URL('https://cursor.com/link/prompt');
  
  // Combine text and images
  let fullPrompt = promptText;
  
  if (images.length > 0) {
    // Add images with @ prefix
    const imageUrls = images.map(img => `@${img}`).join('\n');
    fullPrompt = `${promptText}\n\nImages:\n${imageUrls}`;
  }
  
  url.searchParams.set('text', fullPrompt);
  return url.toString();
}

// Initialize text selection tracking
trackTextSelection();
