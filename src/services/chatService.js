import api from "./api";

export async function sendMessage(message, history = [], sessionId = null) {
  const payload = { message };
  if (sessionId) {
    payload.session_id = sessionId;
  }
  const response = await api.post("/assistant/chat", payload);
  return response.data;
}

export async function getChatHistory() {
  const response = await api.get("/chat/history");
  return response.data;
}

export async function getPolicyPages() {
  const response = await api.get("/chat/policy-pages");
  return response.data;
}

export function getPolicyPdfUrl() {
  const baseURL = api.defaults.baseURL || "http://localhost:8001/api/v1";
  return `${baseURL}/chat/pdf`;
}
