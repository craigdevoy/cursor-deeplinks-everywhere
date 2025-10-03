// Background script for Cursor Deeplinks Everywhere
console.log('Cursor Deeplinks Everywhere background script loaded');

// Extension installation/startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  // Set default settings
  chrome.storage.sync.set({
    deeplinksEnabled: true,
    selectionTrackingEnabled: true
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup, but we can also add additional logic here
  console.log('Extension icon clicked on tab:', tab.url);
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'getSettings':
      chrome.storage.sync.get(['deeplinksEnabled', 'selectionTrackingEnabled'], (result) => {
        sendResponse(result);
      });
      return true; // Keep message channel open for async response
      
    case 'updateSettings':
      chrome.storage.sync.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;
      
  }
});



// Context menu for text selection
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'openInCursor',
    title: 'Open in Cursor',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'addImageToSelection',
    title: 'Add Image to Selection',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openInCursor' && info.selectionText) {
    // Open selected text in Cursor
    chrome.tabs.sendMessage(tab.id, {
      action: 'openInCursor',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'addImageToSelection' && info.srcUrl) {
    // Add image to current text selection
    chrome.tabs.sendMessage(tab.id, {
      action: 'addImageToSelection',
      imageUrl: info.srcUrl
    });
  }
});

