import axios from "axios";
import type {
  GmailStatus,
  GmailExtractResult,
  FBUploadResult,
  FBExtractResult,
  RasaParseResult,
} from "./types";
import { getFlaskUrl, getRasaUrl } from "@/utils/chatbotUrl.util";

const flaskApi = () => axios.create({
  baseURL: getFlaskUrl(),
  headers: { "Content-Type": "application/json" },
});

// ── Gmail ──

export async function gmailGetStatus(): Promise<GmailStatus> {
  const { data } = await flaskApi().get("/extraction/gmail/status");
  return data.result;
}

export async function gmailConnect(): Promise<{ auth_url: string; connected: boolean }> {
  const { data } = await flaskApi().get("/extraction/gmail/connect");
  return data.result;
}

export async function gmailExtract(query: string): Promise<GmailExtractResult> {
  const { data } = await flaskApi().post("/extraction/gmail/extract", { query });
  return data.result;
}

export async function gmailDisconnect(): Promise<void> {
  await flaskApi().post("/extraction/gmail/disconnect");
}

// ── Facebook ──

export async function facebookUpload(file: File): Promise<FBUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await flaskApi().post("/extraction/facebook/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.result;
}

export async function facebookExtract(
  extractId: string,
  ownerName: string,
  selectedConversations?: string[]
): Promise<FBExtractResult> {
  const { data } = await flaskApi().post("/extraction/facebook/extract", {
    extract_id: extractId,
    owner_name: ownerName,
    selected_conversations: selectedConversations,
  });
  return data.result;
}

export async function facebookCleanup(extractId: string): Promise<void> {
  await flaskApi().delete(`/extraction/facebook/upload/${extractId}`);
}

// ── Rasa Parse ──

export async function rasaParse(text: string): Promise<RasaParseResult> {
  const { data } = await axios.post(`${getRasaUrl()}/model/parse`, {
    text,
  });
  return data;
}
