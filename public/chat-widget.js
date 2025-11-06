class ChatWidget {
    constructor() {
        // Base API URL — change when deployed
        this.API_BASE_URL = 'http://localhost:3000'; 

        // Generate a random session ID per user
        this.sessionId = this.generateSessionId();

        // ✅ Try to get Slipchat API key
        const currentScript = document.currentScript || document.querySelector('script[src*="chat-widget.js"]');
        this.apiKey = currentScript?.getAttribute('data-api-key') || 'demo_key_123';

        this.init();
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        const chatToggle = document.getElementById('chatToggle');
        const chatWindow = document.getElementById('chatWindow');
        const closeChat = document.getElementById('closeChat');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        chatToggle.addEventListener('click', () => {
            chatWindow.classList.add('active');
            messageInput.focus();
        });

        closeChat.addEventListener('click', () => {
            chatWindow.classList.remove('active');
        });

        sendButton.addEventListener('click', () => this.sendMessage());
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    addMessage(text, isUser = false) {
        const chatBody = document.getElementById('chatBody');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        if (isUser) {
            messageDiv.innerHTML = `
                <div class="message-content" style="margin-left: auto; max-width: 70%;">
                    <div class="message-text" style="background: var(--color-primary); color: white;">
                        ${this.escapeHtml(text)}
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">💬</div>
                <div class="message-content">
                    <div class="message-text">
                        ${this.escapeHtml(text)}
                    </div>
                </div>
            `;
        }
        
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        if (!message) return;

        this.addMessage(message, true);
        messageInput.value = '';

        this.addTypingIndicator();

        try {
            const response = await fetch(`${this.API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey  // ✅ Add Slipchat API key header
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });

            this.removeTypingIndicator();

            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            this.addMessage(data.reply, false);

        } catch (error) {
            this.removeTypingIndicator();
            console.error('Error:', error);
            this.addMessage('Sorry, I encountered an error. Please try again.', false);
        }
    }

    addTypingIndicator() {
        const chatBody = document.getElementById('chatBody');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">💬</div>
            <div class="message-content">
                <div class="message-text">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;
        chatBody.appendChild(typingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatWidget();
});
