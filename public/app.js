const gardenSelect = document.getElementById('garden-select');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendButton = chatForm.querySelector('button[type="submit"]');
const uploadBtn = document.getElementById('upload-btn');
const imageInput = document.getElementById('image-input');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const saveSettings = document.getElementById('save-settings');
const newChatBtn = document.getElementById('new-chat-btn');

// API Keys storage
const API_KEYS = {
    openai: '',
    anthropic: '',
    gemini: '',
    groq: ''
};

// Auto-detect which provider to use based on available API keys
function getAvailableProvider() {
    if (API_KEYS.openai) return 'openai';
    if (API_KEYS.anthropic) return 'anthropic';
    if (API_KEYS.gemini) return 'gemini';
    if (API_KEYS.groq) return 'groq';
    return null;
}

// Settings modal handlers
if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
}


// Load API keys from localStorage
function loadAPIKeys() {
    const stored = localStorage.getItem('indigo_api_keys');
    if (stored) {
        const keys = JSON.parse(stored);
        Object.assign(API_KEYS, keys);

        // Update UI
        const openaiInput = document.getElementById('openai-key');
        const anthropicInput = document.getElementById('anthropic-key');
        const geminiInput = document.getElementById('gemini-key');
        const groqInput = document.getElementById('groq-key');

        if (openaiInput) openaiInput.value = keys.openai || '';
        if (anthropicInput) anthropicInput.value = keys.anthropic || '';
        if (geminiInput) geminiInput.value = keys.gemini || '';
        if (groqInput) groqInput.value = keys.groq || '';
    }
}

// Save API keys to localStorage
function saveAPIKeys() {
    const keys = {
        openai: document.getElementById('openai-key').value,
        anthropic: document.getElementById('anthropic-key').value,
        gemini: document.getElementById('gemini-key').value,
        groq: document.getElementById('groq-key').value
    };

    localStorage.setItem('indigo_api_keys', JSON.stringify(keys));
    Object.assign(API_KEYS, keys);

    addMessage('system', '✅ API keys saved successfully!');
    settingsModal.classList.remove('active');

    // Reload gardens after saving keys
    loadGardens();
}

// Save settings button
if (saveSettings) {
    saveSettings.addEventListener('click', saveAPIKeys);
}

// New chat button
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        chatWindow.innerHTML = '<div class="message system">👋 Start a new conversation about your garden!</div>';
        messageInput.focus();
    });
}

// Load gardens on start
async function loadGardens() {
    try {
        const res = await fetch('/api/gardens');
        const data = await res.json();

        // Clear logic
        gardenSelect.innerHTML = '<option value="" disabled selected>Select Garden...</option>';

        data.gardens.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name.replace(/-/g, ' ').toUpperCase();
            gardenSelect.appendChild(option);
        });

        if (data.gardens.length > 0) {
            gardenSelect.value = data.gardens[0]; // Select first by default
            addMessage('system', `Loaded ${data.gardens.length} garden profiles. Selected: ${data.gardens[0]}`);
        }
    } catch (e) {
        addMessage('system', 'Error loading gardens. Click ⚙️ to configure API keys.');
    }
}

function addMessage(role, text, imageUrl) {
    const div = document.createElement('div');
    div.classList.add('message', role);

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Uploaded plant image';
        div.appendChild(img);
    }

    const textNode = document.createTextNode(text);
    div.appendChild(textNode);

    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Image upload handler
uploadBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const gardenName = gardenSelect.value;
    const provider = getAvailableProvider();

    if (!gardenName) {
        alert('Please select a garden profile first.');
        return;
    }

    if (!provider) {
        alert('Please configure at least one API key in settings.');
        settingsModal.classList.add('active');
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target.result.split(',')[1];
        const imageUrl = event.target.result;

        addMessage('user', 'Uploaded image for analysis', imageUrl);
        uploadBtn.disabled = true;
        sendButton.disabled = true;

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEYS[provider]
                },
                body: JSON.stringify({
                    image: base64,
                    gardenName,
                    provider,
                    description: file.name
                })
            });

            const data = await res.json();

            if (data.error) {
                addMessage('system', `Error: ${data.error}`);
            } else {
                addMessage('indigo', data.analysis);
            }
        } catch (e) {
            addMessage('system', 'Network error during image analysis.');
        } finally {
            uploadBtn.disabled = false;
            sendButton.disabled = false;
            imageInput.value = ''; // Reset input
        }
    };

    reader.readAsDataURL(file);
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    const gardenName = gardenSelect.value;
    const provider = getAvailableProvider();

    if (!text) return;
    if (!gardenName) {
        alert('Please select a garden profile first.');
        return;
    }

    if (!provider) {
        alert('Please configure at least one API key in settings.');
        settingsModal.classList.add('active');
        return;
    }

    // UI Update
    addMessage('user', text);
    messageInput.value = '';
    sendButton.disabled = true;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEYS[provider]
            },
            body: JSON.stringify({
                message: text,
                gardenName,
                provider
            })
        });

        const data = await res.json();

        if (data.error) {
            addMessage('system', `Error: ${data.error}`);
        } else {
            addMessage('indigo', data.response);
        }
    } catch (e) {
        addMessage('system', 'Network error. Please try again.');
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
});

// Initialize
loadAPIKeys();
loadGardens();
