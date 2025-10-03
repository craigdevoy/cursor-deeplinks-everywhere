document.addEventListener('DOMContentLoaded', function() {
//   const settingsBtn = document.getElementById('settingsBtn');
  const status = document.getElementById('status');
  const selectedTextDisplay = document.getElementById('selectedTextDisplay');
  const selectedTextContent = document.querySelector('.selected-text-content');
  const selectedImagesDisplay = document.getElementById('selectedImagesDisplay');
  const imagesList = document.getElementById('imagesList');
  const noSelectionMessage = document.getElementById('noSelectionMessage');
  const openInCursorBtn = document.getElementById('openInCursorBtn');
  const enableToggle = document.getElementById('enableToggle');
  const toggleLabel = document.getElementById('toggleLabel');

  // Show status message
  function showStatus(message, type = 'success') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }


  // Open settings
//   settingsBtn.addEventListener('click', () => {
//     chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
//   });

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
      
      if (response && (response.text || (response.images && response.images.length > 0))) {
        // Display text
        if (response.text) {
          selectedTextContent.textContent = response.text;
        } else {
          selectedTextContent.textContent = '[No text selected]';
        }
        
        // Display images
        if (response.images && response.images.length > 0) {
          displayImages(response.images);
          selectedImagesDisplay.style.display = 'block';
        } else {
          selectedImagesDisplay.style.display = 'none';
        }
        
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

  // Display images in the popup
  function displayImages(images) {
    imagesList.innerHTML = '';
    
    images.forEach((imageUrl, index) => {
      const imageItem = document.createElement('div');
      imageItem.className = 'image-item';
      
      imageItem.innerHTML = `
        <img src="${imageUrl}" alt="Image ${index + 1}" onerror="this.style.display='none'">
        <div class="image-url">${imageUrl}</div>
      `;
      
      imagesList.appendChild(imageItem);
    });
  }

  // Handle toggle switch
  enableToggle.addEventListener('change', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const isEnabled = enableToggle.checked;
      
      // Send toggle message to content script
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleSelectionTracking', 
        enabled: isEnabled 
      });
      
      // Update UI state
      updateUIState(isEnabled);
      
      // Save setting
      chrome.storage.sync.set({ selectionTrackingEnabled: isEnabled });
      
      showStatus(isEnabled ? 'Selection tracking enabled' : 'Selection tracking disabled');
    } catch (error) {
      console.error('Error toggling selection tracking:', error);
      showStatus('Error updating setting', 'error');
    }
  });

  // Update UI based on toggle state
  function updateUIState(isEnabled) {
    if (isEnabled) {
      toggleLabel.textContent = 'Text & Image Selection';
      selectedTextDisplay.style.opacity = '1';
      noSelectionMessage.style.opacity = '1';
    } else {
      toggleLabel.textContent = 'Text & Image Selection (Disabled)';
      selectedTextDisplay.style.opacity = '0.5';
      noSelectionMessage.style.opacity = '0.5';
      // Clear current selection when disabled
      selectedTextDisplay.style.display = 'none';
      noSelectionMessage.style.display = 'block';
    }
  }

  // Load initial toggle state
  async function loadToggleState() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // First get the current state from the content script
      let contentScriptState;
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'getSelectionTrackingState' 
        });
        contentScriptState = response?.enabled;
      } catch (error) {
        console.log('Could not get state from content script, using storage');
        contentScriptState = null;
      }
      
      // Fallback to storage if content script doesn't respond
      if (contentScriptState === null || contentScriptState === undefined) {
        const result = await chrome.storage.sync.get(['selectionTrackingEnabled']);
        contentScriptState = result.selectionTrackingEnabled !== false; // Default to true
      }
      
      enableToggle.checked = contentScriptState;
      updateUIState(contentScriptState);
      
      // Ensure content script is in sync
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleSelectionTracking', 
        enabled: contentScriptState 
      });
    } catch (error) {
      console.error('Error loading toggle state:', error);
    }
  }

  // Check selected text on popup open
  checkSelectedText();
  
  // Load toggle state
  loadToggleState();

});
