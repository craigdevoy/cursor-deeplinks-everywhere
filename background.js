// Background script for Cursor Deeplinks Everywhere
console.log('Cursor Deeplinks Everywhere background script loaded');

// Extension installation/startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  // Set default settings
  chrome.storage.sync.set({
    deeplinksEnabled: true,
    autoActivate: false,
    customSchemes: ['app://', 'myapp://', 'custom://']
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
      chrome.storage.sync.get(['deeplinksEnabled', 'autoActivate', 'customSchemes'], (result) => {
        sendResponse(result);
      });
      return true; // Keep message channel open for async response
      
    case 'updateSettings':
      chrome.storage.sync.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'activateOnTab':
      activateOnTab(request.tabId);
      sendResponse({ success: true });
      break;
      
    case 'deactivateOnTab':
      deactivateOnTab(request.tabId);
      sendResponse({ success: true });
      break;
  }
});

// Activate deeplinks on a specific tab
async function activateOnTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        // Send message to content script to activate
        chrome.runtime.sendMessage({ action: 'activate' });
      }
    });
  } catch (error) {
    console.error('Error activating on tab:', error);
  }
}

// Deactivate deeplinks on a specific tab
async function deactivateOnTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        // Send message to content script to deactivate
        chrome.runtime.sendMessage({ action: 'deactivate' });
      }
    });
  } catch (error) {
    console.error('Error deactivating on tab:', error);
  }
}

// Handle tab updates (when user navigates to a new page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if auto-activate is enabled
    chrome.storage.sync.get(['autoActivate'], (result) => {
      if (result.autoActivate) {
        // Inject content script and activate
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }).then(() => {
          activateOnTab(tabId);
        }).catch(error => {
          console.error('Error injecting content script:', error);
        });
      }
    });
  }
});

// Context menu for deeplinks and text selection
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'handleDeeplink',
    title: 'Handle as Deeplink',
    contexts: ['link']
  });
  
  chrome.contextMenus.create({
    id: 'openInCursor',
    title: 'Open in Cursor',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'handleDeeplink' && info.linkUrl) {
    // Send message to content script to handle the deeplink
    chrome.tabs.sendMessage(tab.id, {
      action: 'handleDeeplink',
      url: info.linkUrl
    });
  } else if (info.menuItemId === 'openInCursor' && info.selectionText) {
    // Open selected text in Cursor
    chrome.tabs.sendMessage(tab.id, {
      action: 'openInCursor',
      text: info.selectionText
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  
  switch (command) {
    case 'toggle-deeplinks':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' });
        }
      });
      break;
  }
});
