import api from "./api";

export async function sendMessage(message, history = []) {
  const payload = { message };
  if (history && history.length > 0) {
    payload.history = history;
  }
  const response = await api.post("/chat", payload);
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
