// services/chat-service.js
import { supabase } from "../auth/supabaseClient"; // adjust path to your client

/** Create a new chat session, returns the chat row */
export async function createChat(userId, title = "New chat") {
  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, title })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Save a single message to a chat */
export async function saveMessage(chatId, role, text) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, role, text })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Fetch all chats for the sidebar */
export async function fetchChats(userId) {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Fetch all messages for a chat */
export async function fetchMessages(chatId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

/** Delete a chat (messages cascade via FK) */
export async function deleteChat(chatId) {
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId);
  if (error) throw error;
}