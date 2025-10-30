// Replace with your Lambda Function URL
const LAMBDA_URL = "https://z2fkpefkca.execute-api.us-east-1.amazonaws.com/default/frontend-to-agent";

const chatbox = document.getElementById("chatbox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const suggestionsContainer = document.getElementById("suggestions");

let sessionId = localStorage.getItem("sessionId") || null;
let isWaiting = false;

// --- Helpers ---
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerHTML = text.replace(/\n/g, "<br>");

  const time = document.createElement("span");
  time.className = "timestamp";
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  msg.appendChild(time);

  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function addCitations(citations) {
  if (!citations || citations.length === 0) return;

  const citationContainer = document.createElement("div");
  citationContainer.className = "citations";
  citationContainer.innerHTML = `<strong>Referenced Documents:</strong>`;

  citations.forEach(cite => {
    const link = document.createElement("a");
    link.href = cite.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `📄 ${cite.title}`;
    link.style.display = "block";
    link.style.marginTop = "4px";
    citationContainer.appendChild(link);
  });

  chatbox.appendChild(citationContainer);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Typing indicator
function showTyping() {
  const typing = document.createElement("div");
  typing.className = "message bot typing";
  typing.textContent = "Bot is typing...";
  chatbox.appendChild(typing);
  chatbox.scrollTop = chatbox.scrollHeight;
  return typing;
}

// Show suggestion buttons
function showSuggestions(options) {
  suggestionsContainer.innerHTML = "";
  options.forEach(text => {
    const btn = document.createElement("button");
    btn.className = "suggestion-btn";
    btn.textContent = text;
    btn.addEventListener("click", () => {
      messageInput.value = text;
      sendMessage();
      suggestionsContainer.innerHTML = "";
    });
    suggestionsContainer.appendChild(btn);
  });
}

// Chat persistence
function saveChat() {
  localStorage.setItem("chatHistory", chatbox.innerHTML);
}

function loadChat() {
  const saved = localStorage.getItem("chatHistory");
  if (saved) chatbox.innerHTML = saved;
}

// --- Main sendMessage ---
async function sendMessage() {
  if (isWaiting) return;

  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  addMessage("user", userMessage);
  messageInput.value = "";

  isWaiting = true;
  sendBtn.disabled = true;

  const typingIndicator = showTyping();

  try {
    const response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, session_id: sessionId })
    });

    const data = await response.json();
    typingIndicator.remove();

    // Update session
    if (data.session_id) {
      sessionId = data.session_id;
      localStorage.setItem("sessionId", sessionId);
    }

    // Show bot response
    addMessage("bot", data.response || "No response from agent.");
    if (data.citations) addCitations(data.citations);

    // Show suggestions from API or fallback
    if (data.suggestions && data.suggestions.length > 0) {
      showSuggestions(data.suggestions);
    } else {
      showSuggestions([
        "What are my benefits?",
        "What are my days off?",
        "What can you tell me about the handbook",
        "What is Truebooks Partners?"
      ]);
    }

  } catch (err) {
    typingIndicator.remove();
    addMessage("bot", "⚠️ Error: " + err.message);
  } finally {
    saveChat();
    setTimeout(() => {
      isWaiting = false;
      sendBtn.disabled = false;
    }, 500); // short delay for smooth UX
  }
}

// --- Event listeners ---
window.addEventListener("DOMContentLoaded", () => {
  loadChat();

  // Clear chat button
  const clearBtn = document.getElementById("clearBtn");
  clearBtn.addEventListener("click", () => {
    chatbox.innerHTML = "";
    suggestionsContainer.innerHTML = "";
    localStorage.removeItem("chatHistory");
    localStorage.removeItem("sessionId");
    sessionId = null;
  });
});

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Save chat before closing or refreshing
window.addEventListener("beforeunload", saveChat);
