import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

let isConfigured = false;
let supabaseInstance: any = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    // Try parsing as a URL to ensure it is valid
    new URL(supabaseUrl);
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    isConfigured = true;
  } catch (err) {
    console.error("Supabase Initialization Error: Invalid URL or key format. Defaulting to local offline storage.", err);
  }
}

// Check if credentials are configured and valid
export const isSupabaseConfigured = isConfigured;

// Initialize Supabase Client (or null if not configured)
export const supabase = supabaseInstance;

// Helper function to generate safe UUIDs in any browser, including older mobile devices/WebViews
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Safe math-based fallback for older browsers & WebViews
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Interfaces for our Supabase tables
export interface DBConversion {
  id?: string;
  created_at?: string;
  file_name: string;
  file_size: string;
  duration: number;
  format: string;
  bitrate: number;
  channels: number;
  sample_rate: number;
  volume_boost: number;
}

export interface DBChatMessage {
  id?: string;
  created_at?: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * Save a conversion log to Supabase, or fallback to localStorage
 */
export async function saveConversionLog(log: Omit<DBConversion, "id" | "created_at">) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("conversions")
        .insert([log])
        .select();
      if (error) throw error;
      return data?.[0] as DBConversion;
    } catch (err) {
      console.warn("Failed to save conversion to Supabase:", err);
    }
  }

  // Fallback: LocalStorage
  try {
    const existing = JSON.parse(localStorage.getItem("media_conversions_history") || "[]");
    const newLog = {
      ...log,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    localStorage.setItem("media_conversions_history", JSON.stringify([newLog, ...existing]));
    return newLog;
  } catch (e) {
    console.error("LocalStorage fallback failed:", e);
  }
  return null;
}

/**
 * Fetch conversion logs from Supabase, or fallback to localStorage
 */
export async function getConversionLogs(): Promise<DBConversion[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("conversions")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return data as DBConversion[];
    } catch (err) {
      console.warn("Failed to fetch conversions from Supabase, falling back to LocalStorage:", err);
    }
  }

  try {
    return JSON.parse(localStorage.getItem("media_conversions_history") || "[]");
  } catch {
    return [];
  }
}

/**
 * Save a consultation message to Supabase, or fallback to localStorage
 */
export async function saveChatMessage(message: Omit<DBChatMessage, "id" | "created_at">) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("consultation_messages")
        .insert([message])
        .select();
      if (error) throw error;
      return data?.[0] as DBChatMessage;
    } catch (err) {
      console.warn("Failed to save message to Supabase:", err);
    }
  }

  // Fallback: LocalStorage
  try {
    const existing = JSON.parse(localStorage.getItem("consultation_chat_history") || "[]");
    const newMsg = {
      ...message,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    localStorage.setItem("consultation_chat_history", JSON.stringify([...existing, newMsg]));
    return newMsg;
  } catch (e) {
    console.error("LocalStorage fallback failed:", e);
  }
  return null;
}

/**
 * Fetch chat history from Supabase, or fallback to localStorage
 */
export async function getChatMessages(): Promise<DBChatMessage[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("consultation_messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data) return data as DBChatMessage[];
    } catch (err) {
      console.warn("Failed to fetch messages from Supabase, falling back to LocalStorage:", err);
    }
  }

  try {
    return JSON.parse(localStorage.getItem("consultation_chat_history") || "[]");
  } catch {
    return [];
  }
}

/**
 * Clear chat history in Supabase, or fallback to localStorage
 */
export async function clearChatMessages() {
  if (supabase) {
    try {
      const { error } = await supabase
        .from("consultation_messages")
        .delete()
        .neq("id", ""); // delete all rows
      if (!error) return true;
    } catch (err) {
      console.warn("Failed to clear messages from Supabase:", err);
    }
  }

  try {
    localStorage.removeItem("consultation_chat_history");
    return true;
  } catch {
    return false;
  }
}
