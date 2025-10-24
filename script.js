// Replace with your Lambda Function URL
const LAMBDA_URL = "https://z2fkpefkca.execute-api.us-east-1.amazonaws.com/default/frontend-to-agent";

const chatbox = document.getElementById("chatbox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// store sessionId locally to persist chat context
let sessionId = localStorage.getItem("sessionId") || null;
let isWaiting = false; // cooldown control

// Helper to add text messages to chat
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender;
  msg.textContent = `${sender.toUpperCase()}: ${text}`;
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Helper to add document links/citations
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

async function sendMessage() {
  // prevent spam/clicks too fast
  if (isWaiting) return;

  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  addMessage("user", userMessage);
  messageInput.value = "";

  // enter cooldown mode
  isWaiting = true;
  sendBtn.disabled = true;

  try {
    const response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userMessage, session_id: sessionId })
    });

    const data = await response.json();

    // update sessionId if Lambda returned a new one
    if (data.session_id) {
      sessionId = data.session_id;
      localStorage.setItem("sessionId", sessionId);
    }

    addMessage("bot", data.response || "No response from agent.");

    // ✅ Show citations if they exist
    if (data.citations) {
      addCitations(data.citations);
    }

  } catch (err) {
    addMessage("bot", "Error: " + err.message);
  } finally {
    // release cooldown after 2 seconds
    setTimeout(() => {
      isWaiting = false;
      sendBtn.disabled = false;
    }, 2000);
  }
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});