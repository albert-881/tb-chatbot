// Replace with your Lambda Function URL
const LAMBDA_URL = "https://z2fkpefkca.execute-api.us-east-1.amazonaws.com/default/frontend-to-agent";

const chatbox = document.getElementById("chatbox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// store sessionId locally to persist chat context
let sessionId = localStorage.getItem("sessionId") || null;

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender;
  msg.textContent = `${sender.toUpperCase()}: ${text}`;
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

async function sendMessage() {
  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  addMessage("user", userMessage);
  messageInput.value = "";

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
  } catch (err) {
    addMessage("bot", "Error: " + err.message);
  }
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
