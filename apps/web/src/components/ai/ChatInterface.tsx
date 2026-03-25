"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { Send, Loader2, Wine, AlertCircle } from "lucide-react";
import { captureEvent } from "@/lib/posthog";

// ============================================================
// Types
// ============================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SSEEvent {
  type: "text" | "status" | "done" | "error";
  text?: string;
  status?: string;
  error?: string;
}

// ============================================================
// Storage key
// ============================================================

const STORAGE_KEY = "ywb_ai_chat";

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveHistory(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* ignore */ }
}

// ============================================================
// Component
// ============================================================

interface ChatInterfaceProps {
  quickPrompts: { label: string; prompt: string }[];
  placeholder: string;
  sendLabel: string;
  disclaimer: string;
  thinkingLabel: string;
  searchingLabel: string;
  errorLabel: string;
  retryLabel: string;
  clearLabel: string;
  notConfiguredTitle: string;
  notConfiguredDesc: string;
}

export function ChatInterface({
  quickPrompts,
  placeholder,
  sendLabel,
  disclaimer,
  thinkingLabel,
  searchingLabel,
  errorLabel,
  retryLabel,
  clearLabel,
  notConfiguredTitle,
  notConfiguredDesc,
}: ChatInterfaceProps) {
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persist to sessionStorage
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = { role: "user", content: text.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");

      // Track events
      if (messages.length === 0) {
        captureEvent("ai_chat_started", { locale });
      }
      captureEvent("ai_message_sent", {
        locale,
        messageLength: text.trim().length,
        turnNumber: updatedMessages.filter((m) => m.role === "user").length,
      });
      setIsLoading(true);
      setStreamingText("");
      setStatus(null);
      setError(null);

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            locale,
          }),
          signal: controller.signal,
        });

        if (res.status === 503) {
          setNotConfigured(true);
          setIsLoading(false);
          // Remove user message since we can't process
          setMessages(messages);
          return;
        }

        if (res.status === 429) {
          setError("rate_limited");
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "unknown_error");
          setIsLoading(false);
          return;
        }

        // Read SSE stream
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);

            let event: SSEEvent;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            switch (event.type) {
              case "text":
                fullText += event.text || "";
                setStreamingText(fullText);
                setStatus(null);
                break;
              case "status":
                setStatus(event.status || null);
                break;
              case "error":
                setError(event.error || "unknown_error");
                break;
              case "done":
                break;
            }
          }
        }

        // Add assistant message
        if (fullText) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullText },
          ]);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message || "unknown_error");
        }
      } finally {
        setIsLoading(false);
        setStreamingText("");
        setStatus(null);
        abortRef.current = null;
      }
    },
    [messages, isLoading, locale]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingText("");
    setError(null);
    setNotConfigured(false);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const charCount = input.length;
  const maxChars = 500;
  const isOverLimit = charCount > maxChars;

  // ── Not configured state ──
  if (notConfigured) {
    return (
      <div className="text-center py-12">
        <Wine className="w-12 h-12 text-wine/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{notConfiguredTitle}</h3>
        <p className="text-sm text-text-sub max-w-md mx-auto">
          {notConfiguredDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Wine className="w-10 h-10 text-wine/20 mx-auto mb-3" />
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {quickPrompts.map((qp) => (
                <button
                  key={qp.prompt}
                  onClick={() => sendMessage(qp.prompt)}
                  className="px-4 py-2 text-sm border border-wine-border rounded-full hover:border-wine hover:text-wine transition-colors"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-wine text-white rounded-[14px] rounded-br-sm"
                  : "bg-white border border-wine-border rounded-[14px] rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3.5 text-sm leading-relaxed bg-white border border-wine-border rounded-[14px] rounded-bl-sm whitespace-pre-wrap">
              {streamingText || (
                <span className="flex items-center gap-2 text-text-sub">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status === "searching" ? searchingLabel : thinkingLabel}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3.5 text-sm bg-red-50 border border-red-200 rounded-[14px] rounded-bl-sm">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <AlertCircle className="w-4 h-4" />
                {errorLabel}
              </div>
              <p className="text-red-500 text-xs">
                {error === "rate_limited"
                  ? locale === "zh-HK"
                    ? "請求過於頻繁，請稍後再試。"
                    : "Too many requests. Please try again later."
                  : error}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  if (messages.length > 0) {
                    const lastUser = [...messages]
                      .reverse()
                      .find((m) => m.role === "user");
                    if (lastUser) {
                      // Remove the last user message and retry
                      setMessages((prev) => prev.slice(0, -1));
                      sendMessage(lastUser.content);
                    }
                  }
                }}
                className="mt-2 text-xs text-wine hover:underline"
              >
                {retryLabel}
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-wine-border pt-3">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-3 border border-wine-border rounded-xl text-[15px] bg-white outline-none focus:border-wine resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {charCount > 0 && (
              <span
                className={`absolute right-3 bottom-2 text-[10px] ${
                  isOverLimit ? "text-red-500" : "text-text-sub/50"
                }`}
              >
                {charCount}/{maxChars}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isOverLimit}
            className="inline-flex items-center justify-center w-11 h-11 bg-wine text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-wine-dark transition-colors shrink-0 self-end"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-text-sub/60">* {disclaimer}</p>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-[11px] text-text-sub/60 hover:text-wine transition-colors"
            >
              {clearLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
