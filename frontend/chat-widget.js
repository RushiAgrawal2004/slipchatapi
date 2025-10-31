class ChatWidget {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000';
        this.sessionId = this.generateSessionId();
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
            if (e.key === 'Enter') {
                this.sendMessage();
            }
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
                <div class="message-avatar">🐧</div>
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

        // Show typing indicator
        this.addTypingIndicator();

        try {
            const response = await fetch(`${this.API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });

            this.removeTypingIndicator();

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

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
            <div class="message-avatar">🐧</div>
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
        if (indicator) {
            indicator.remove();
        }
    }
}

// Initialize widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatWidget();
});

// Handle quick action buttons
function handleQuickAction(action) {
    const widget = new ChatWidget();
    widget.addMessage(action, true);
    widget.sendMessage = async function() {
        // Override to send the action text
        const messageInput = document.getElementById('messageInput');
        messageInput.value = action;
        ChatWidget.prototype.sendMessage.call(this);
    };
    widget.sendMessage();
}
