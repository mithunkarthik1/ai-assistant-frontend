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

export async function getDocumentPages(documentId = null) {
  if (!documentId || documentId === "00000000-0000-0000-0000-000000000002") {
    return await getPolicyPages();
  }
  const response = await api.get(`/documents/${documentId}/pages`);
  return response.data;
}

export function getPolicyPdfUrl() {
  const baseURL = api.defaults.baseURL || "http://localhost:8001/api/v1";
  return `${baseURL}/chat/pdf`;
}

export async function uploadDocument(file, onProgress = null) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/documents/upload", formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return response.data;
}

export async function getDocuments() {
  const response = await api.get("/documents");
  return response.data;
}

export async function getDocumentDetail(documentId) {
  const response = await api.get(`/documents/${documentId}`);
  return response.data;
}

export async function deleteDocument(documentId) {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
}

