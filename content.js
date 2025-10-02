// Content script for Cursor Deeplinks Everywhere
console.log('Cursor Deeplinks Everywhere content script loaded');

// Initialize extension state
let isActive = false;
let deeplinkHandlers = new Map();
let selectedText = '';
let selectionRange = null;

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'activate':
      activateDeeplinks();
      sendResponse({ success: true });
      break;
    case 'deactivate':
      deactivateDeeplinks();
      sendResponse({ success: true });
      break;
    case 'getStatus':
      sendResponse({ active: isActive });
      break;
    case 'getSelectedText':
      sendResponse({ text: selectedText });
      break;
    case 'openInCursor':
      openSelectedTextInCursor(request.text || selectedText);
      sendResponse({ success: true });
      break;
  }
});

// Activate deeplink functionality
function activateDeeplinks() {
  if (isActive) return;
  
  isActive = true;
  console.log('Activating deeplinks on:', window.location.href);
  
  // Add click handlers to links
  addLinkHandlers();
  
  // Watch for dynamically added links
  observeNewLinks();
  
  // Show activation indicator
  showActivationIndicator();
}

// Deactivate deeplink functionality
function deactivateDeeplinks() {
  if (!isActive) return;
  
  isActive = false;
  console.log('Deactivating deeplinks');
  
  // Remove all handlers
  deeplinkHandlers.forEach((handler, element) => {
    element.removeEventListener('click', handler);
  });
  deeplinkHandlers.clear();
  
  // Disconnect observer
  if (linkObserver) {
    linkObserver.disconnect();
  }
  
  // Remove activation indicator
  removeActivationIndicator();
}

// Add click handlers to existing links
function addLinkHandlers() {
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    if (!deeplinkHandlers.has(link)) {
      const handler = (event) => handleLinkClick(event, link);
      link.addEventListener('click', handler);
      deeplinkHandlers.set(link, handler);
    }
  });
}

// Handle link clicks
function handleLinkClick(event, link) {
  const href = link.getAttribute('href');
  
  // Check if it's a deeplink
  if (isDeeplink(href)) {
    console.log('Deeplink detected:', href);
    
    // Prevent default behavior
    event.preventDefault();
    
    // Handle the deeplink
    handleDeeplink(href);
  }
}

// Check if a URL is a deeplink
function isDeeplink(url) {
  if (!url) return false;
  
  // Common deeplink patterns
  const deeplinkPatterns = [
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/, // Custom scheme (e.g., app://, myapp://)
    /^\/\/[^\/]+\/[^\/]+/, // Protocol-relative with custom domain
  ];
  
  return deeplinkPatterns.some(pattern => pattern.test(url));
}

// Handle deeplink
function handleDeeplink(url) {
  try {
    // Try to open the deeplink
    window.location.href = url;
  } catch (error) {
    console.error('Error handling deeplink:', error);
    
    // Fallback: show user notification
    showNotification('Deeplink detected but could not be opened: ' + url);
  }
}

// Watch for new links added to the page
let linkObserver;
function observeNewLinks() {
  linkObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node is a link
          if (node.tagName === 'A' && node.href) {
            addLinkHandlerToElement(node);
          }
          
          // Check for links within the added node
          const links = node.querySelectorAll && node.querySelectorAll('a[href]');
          if (links) {
            links.forEach(link => addLinkHandlerToElement(link));
          }
        }
      });
    });
  });
  
  linkObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Add handler to a specific element
function addLinkHandlerToElement(element) {
  if (!deeplinkHandlers.has(element)) {
    const handler = (event) => handleLinkClick(event, element);
    element.addEventListener('click', handler);
    deeplinkHandlers.set(element, handler);
  }
}

// Show activation indicator
function showActivationIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'cursor-deeplinks-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #007bff;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  indicator.textContent = 'Deeplinks Active';
  document.body.appendChild(indicator);
}

// Remove activation indicator
function removeActivationIndicator() {
  const indicator = document.getElementById('cursor-deeplinks-indicator');
  if (indicator) {
    indicator.remove();
  }
}

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
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      selectedText = selection.toString().trim();
      selectionRange = selection.getRangeAt(0);
      console.log('Text selected:', selectedText);
      
      // Show selection indicator
      showSelectionIndicator();
    } else {
      selectedText = '';
      selectionRange = null;
      hideSelectionIndicator();
    }
  });
  
  // Also track keyboard selection
  document.addEventListener('keyup', (event) => {
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
  
  indicator.innerHTML = `
    <div style="margin-bottom: 4px; font-weight: bold;">📝 Selected Text</div>
    <div style="margin-bottom: 8px; opacity: 0.9; max-height: 60px; overflow: hidden;">${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}</div>
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

// Open selected text in Cursor
function openSelectedTextInCursor(text) {
  if (!text) {
    showNotification('No text selected');
    return;
  }
  
  try {
    // Generate Cursor deeplink
    const deeplink = generateCursorPromptDeeplink(text);
    
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
function generateCursorPromptDeeplink(promptText) {
  // Use the web format for better browser compatibility
  const url = new URL('https://cursor.com/link/prompt');
  url.searchParams.set('text', promptText);
  return url.toString();
}

// Initialize text selection tracking
trackTextSelection();
