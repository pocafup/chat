// 对话历史，格式与 Anthropic Messages API 一致：
// [{ role: "user", content: "..." }, { role: "assistant", content: "..." }, ...]
// 每次发送时把完整历史传给后端，Claude 才能记住上下文。
const messages = [];

const messagesEl = document.getElementById("messages");
const inputEl    = document.getElementById("user-input");
const sendBtn    = document.getElementById("send-btn");

// 在消息列表里追加一条气泡
function appendMessage(role, text) {
  const div = document.createElement("div");
  div.classList.add("message", role);
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// 发送消息并等待 Claude 回复
async function handleSend() {
  const text = inputEl.value.trim();
  if (!text) return;

  // 立即显示用户消息，同时禁用输入防止重复发送
  appendMessage("user", text);
  messages.push({ role: "user", content: text });
  inputEl.value = "";
  autoResize();
  setLoading(true);

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 把完整历史发给后端，后端原样转给 Claude
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      appendMessage("assistant", `错误：${data.error || "未知错误"}`);
      // 出错时把刚才加入的用户消息从历史里移除，方便重试
      messages.pop();
      return;
    }

    appendMessage("assistant", data.reply);
    // 把 Claude 的回复也存入历史，下次发送时一起带上
    messages.push({ role: "assistant", content: data.reply });

  } catch (err) {
    appendMessage("assistant", `网络错误：${err.message}`);
    messages.pop();
  } finally {
    setLoading(false);
  }
}

// 等待回复期间禁用输入框和按钮，避免用户重复提交
function setLoading(loading) {
  sendBtn.disabled = loading;
  inputEl.disabled = loading;
  sendBtn.textContent = loading ? "发送中…" : "发送";
  if (!loading) inputEl.focus();
}

// 让 textarea 随内容自动撑高，最大高度由 CSS max-height 控制
function autoResize() {
  inputEl.style.height = "auto";
  inputEl.style.height = inputEl.scrollHeight + "px";
}

sendBtn.addEventListener("click", handleSend);

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

inputEl.addEventListener("input", autoResize);
