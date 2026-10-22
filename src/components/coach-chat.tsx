"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { cn, formatTime, dayKey } from "@/lib/utils";
import type { CoachMessage } from "@/db/schema";

interface Props {
  initial: CoachMessage[];
}

const QUICK_KEYS = ["q1", "q2", "q3", "q4"] as const;

export function CoachChat({ initial }: Props) {
  const t = useTranslations("coach");
  const locale = useLocale();
  const [messages, setMessages] = useState<CoachMessage[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send(rawContent?: string) {
    const content = (rawContent ?? text).trim();
    if (!content || busy) return;
    setBusy(true);
    setError(null);
    if (!rawContent) setText("");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        userMsg?: CoachMessage;
        assistantMsg?: CoachMessage;
        error?: string;
      };
      if (data.userMsg) setMessages((m) => [...m, data.userMsg!]);
      if (!res.ok) {
        throw new Error(data.error ?? "Failed");
      }
      if (data.assistantMsg) setMessages((m) => [...m, data.assistantMsg!]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    if (!confirm(locale === "zh" ? "确定清空所有聊天记录？" : locale === "en" ? "Clear all chat?" : "Sohbeti temizle?")) return;
    const res = await fetch("/api/coach", { method: "DELETE" });
    if (res.ok) setMessages([]);
  }

  const isEmpty = messages.length === 0;
  const quickPrompts = QUICK_KEYS.map((k) => t(`quick.${k}`));

  return (
    <div className="-mx-4 -mb-28 flex min-h-[calc(100dvh-72px)] flex-col">
      {messages.length > 0 && (
        <div className="flex items-center justify-end px-4 pt-2">
          <button
            type="button"
            onClick={clearAll}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-destructive"
            aria-label={t("clear")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isEmpty && !busy ? (
          <div className="flex h-full flex-col justify-center gap-6 py-8">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-foreground text-background">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-4 text-[15px] text-muted-foreground">
                {t("empty")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => send(q)}
                  disabled={busy}
                  className="flex flex-col items-start gap-1 rounded-2xl bg-card p-4 text-left text-[14px] font-medium transition-colors hover:bg-foreground/[0.04] active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          (() => {
            const todayKey = dayKey(new Date());
            const dayFmt = new Intl.DateTimeFormat(
              locale === "zh" ? "zh-CN" : locale === "en" ? "en-GB" : "tr-TR",
              { day: "numeric", month: "long" },
            );
            let lastShownDay: string | null = null;
            return messages.map((m) => {
              const at =
                m.createdAt instanceof Date
                  ? m.createdAt
                  : new Date(m.createdAt as unknown as number);
              const mDay = dayKey(at);
              const showDayHeader = mDay !== lastShownDay;
              lastShownDay = mDay;
              return (
                <div key={m.id} className="space-y-1.5">
                  {showDayHeader && (
                    <div className="my-2 flex items-center justify-center">
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        {mDay === todayKey
                          ? locale === "zh" ? "今天" : locale === "en"
                            ? "Today"
                            : "Bugün"
                          : dayFmt.format(at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex flex-col gap-1",
                      m.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-snug",
                        m.role === "user"
                          ? "bg-foreground text-background"
                          : "bg-card text-foreground",
                      )}
                    >
                      {m.content}
                    </div>
                    <span className="px-2 text-[10px] tabular-nums text-muted-foreground">
                      {formatTime(at, locale)}
                    </span>
                  </div>
                </div>
              );
            });
          })()
        )}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-card px-4 py-2.5 text-[14px] text-muted-foreground">
              <Loader2 className="inline h-4 w-4 animate-spin" />
              <span className="ml-2">{t("thinking")}</span>
            </div>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
          >
            {error}<Link href="/ai-connect" className="ml-2 underline">连接设置</Link>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="safe-bottom sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        {!isEmpty && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => send(q)}
                disabled={busy}
                className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-foreground/[0.1] disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="px-4 py-3"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("placeholder")}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="min-h-[42px] max-h-32 flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-4 py-2.5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              aria-label={t("send")}
              className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform active:scale-95 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
