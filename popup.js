document.addEventListener('DOMContentLoaded', function() {
  const activateBtn = document.getElementById('activateBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const status = document.getElementById('status');
  const selectedTextDisplay = document.getElementById('selectedTextDisplay');
  const selectedTextContent = document.querySelector('.selected-text-content');
  const noSelectionMessage = document.getElementById('noSelectionMessage');
  const openInCursorBtn = document.getElementById('openInCursorBtn');

  // Show status message
  function showStatus(message, type = 'success') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }

  // Activate extension on current tab
  activateBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: activateDeeplinks
      });
      
      showStatus('Extension activated on this page!');
    } catch (error) {
      console.error('Error activating extension:', error);
      showStatus('Error activating extension', 'error');
    }
  });

  // Open settings
  settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });

  // Open selected text in Cursor
  openInCursorBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.tabs.sendMessage(tab.id, { action: 'openInCursor' });
      
      showStatus('Opening in Cursor...');
    } catch (error) {
      console.error('Error opening in Cursor:', error);
      showStatus('Error opening in Cursor', 'error');
    }
  });

  // Check for selected text when popup opens
  async function checkSelectedText() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' });
      
      if (response && response.text) {
        selectedTextContent.textContent = response.text;
        selectedTextDisplay.style.display = 'block';
        noSelectionMessage.style.display = 'none';
      } else {
        selectedTextDisplay.style.display = 'none';
        noSelectionMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Error checking selected text:', error);
      selectedTextDisplay.style.display = 'none';
      noSelectionMessage.style.display = 'block';
    }
  }

  // Check selected text on popup open
  checkSelectedText();

  // Function to inject into the page
  function activateDeeplinks() {
    // This function will be executed in the context of the current page
    console.log('Deeplinks extension activated!');
    
    // Add a visual indicator
    const indicator = document.createElement('div');
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
    `;
    indicator.textContent = 'Deeplinks Active';
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      indicator.remove();
    }, 3000);
  }
});
