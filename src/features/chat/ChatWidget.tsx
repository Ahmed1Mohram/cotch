"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type ThreadRow = {
  id: string;
  course_id: string;
  user_id: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

function fmtTime(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 14a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
    </svg>
  );
}

export function ChatWidget({
  courseId,
  courseTitle,
  className,
}: {
  courseId: string;
  courseTitle: string;
  className?: string;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [booting, setBooting] = useState(false);
  const [thread, setThread] = useState<ThreadRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => scrollToBottom(), 50);
    return () => window.clearTimeout(t);
  }, [open, messages.length]);

  const ensureThread = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) {
      setError("لازم تسجل دخول الأول");
      return null;
    }

    const existing = await supabase
      .from("chat_threads")
      .select("id,course_id,user_id")
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing.error && existing.data?.id) {
      const t: ThreadRow = {
        id: String((existing.data as any).id),
        course_id: String((existing.data as any).course_id),
        user_id: String((existing.data as any).user_id),
      };
      setThread(t);
      return t;
    }

    const prof = await supabase.from("user_profiles").select("full_name,phone").eq("user_id", user.id).maybeSingle();

    const insertRes = await supabase
      .from("chat_threads")
      .insert({
        course_id: courseId,
        user_id: user.id,
        user_full_name: (prof.data as any)?.full_name ?? null,
        user_phone: (prof.data as any)?.phone ?? null,
      })
      .select("id,course_id,user_id")
      .single();

    if (insertRes.error) {
      const retry = await supabase
        .from("chat_threads")
        .select("id,course_id,user_id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!retry.error && retry.data?.id) {
        const t: ThreadRow = {
          id: String((retry.data as any).id),
          course_id: String((retry.data as any).course_id),
          user_id: String((retry.data as any).user_id),
        };
        setThread(t);
        return t;
      }

      setError(insertRes.error.message);
      return null;
    }

    const t: ThreadRow = {
      id: String((insertRes.data as any).id),
      course_id: String((insertRes.data as any).course_id),
      user_id: String((insertRes.data as any).user_id),
    };
    setThread(t);
    return t;
  };

  const loadMessages = async (threadId: string) => {
    const res = await supabase
      .from("chat_messages")
      .select("id,thread_id,sender_user_id,sender_role,body,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (res.error) {
      setError(res.error.message);
      setMessages([]);
      return;
    }

    const list: MessageRow[] = ((res.data as any[]) ?? []).map((m) => ({
      id: String(m.id),
      thread_id: String(m.thread_id),
      sender_user_id: String(m.sender_user_id),
      sender_role: (m.sender_role === "admin" ? "admin" : "user") as any,
      body: String(m.body ?? ""),
      created_at: String(m.created_at ?? ""),
    }));

    setMessages(list);
  };

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const run = async () => {
      setBooting(true);
      setError(null);

      const t = await ensureThread();
      if (!mounted || !t) {
        setBooting(false);
        return;
      }

      await loadMessages(t.id);
      if (!mounted) return;

      channel = supabase
        .channel(`chat-thread-${t.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${t.id}` },
          (payload) => {
            const m = payload.new as any;
            const next: MessageRow = {
              id: String(m.id),
              thread_id: String(m.thread_id),
              sender_user_id: String(m.sender_user_id),
              sender_role: (m.sender_role === "admin" ? "admin" : "user") as any,
              body: String(m.body ?? ""),
              created_at: String(m.created_at ?? ""),
            };
            setMessages((prev) => (prev.some((x) => x.id === next.id) ? prev : [...prev, next]));
          },
        )
        .subscribe();

      setBooting(false);
    };

    void run().catch((e) => {
      if (!mounted) return;
      setBooting(false);
      setError(e instanceof Error ? e.message : String(e));
    });

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [open, courseId, supabase]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        setError("لازم تسجل دخول الأول");
        return;
      }

      const t = thread ?? (await ensureThread());
      if (!t) return;

      const ins = await supabase.from("chat_messages").insert({
        thread_id: t.id,
        sender_user_id: user.id,
        sender_role: "user",
        body: text,
      });

      if (ins.error) {
        setError(ins.error.message);
        return;
      }

      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("fixed bottom-5 right-5 z-50", className)} dir="rtl">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "grid h-14 w-14 place-items-center rounded-2xl bg-[#FF6A00]/90 text-white shadow-[0_18px_70px_-40px_rgba(255,106,0,0.65)] transition hover:bg-[#FF6A00]",
          open && "opacity-0 pointer-events-none",
        )}
        aria-label="فتح الشات"
      >
        <ChatIcon className="h-7 w-7" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" dir="rtl">
          <button
            type="button"
            aria-label="إغلاق"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/55"
          />

          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[560px]">
            <div className="rounded-t-[28px] bg-[#0B0B0B] shadow-[0_-24px_90px_-44px_rgba(0,0,0,0.85)] border border-white/10">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0">
                  <div className="truncate text-right text-sm font-semibold text-white">الشات</div>
                  <div className="mt-1 truncate text-right text-xs text-white/60">{courseTitle}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 text-white/80 border border-white/10"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>

              <div
                ref={listRef}
                className="h-[62vh] overflow-auto px-4 pb-3"
              >
                {booting ? (
                  <div className="py-10 text-center text-sm text-white/60">تحميل...</div>
                ) : error ? (
                  <div className="py-10 text-center text-sm text-[#FFB35A]">{error}</div>
                ) : messages.length === 0 ? (
                  <div className="py-10 text-center text-sm text-white/60">ابعت أول رسالة…</div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((m) => {
                      const mine = m.sender_role === "user";
                      return (
                        <div
                          key={m.id}
                          className={cn("flex", mine ? "justify-start" : "justify-end")}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
                              mine ? "bg-[#FF6A00]/20 text-white" : "bg-white/5 text-white/85",
                            )}
                          >
                            <div className="whitespace-pre-wrap text-right leading-6">{m.body}</div>
                            <div className="mt-1 text-right text-[11px] text-white/45">{fmtTime(m.created_at)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    placeholder="اكتب رسالتك…"
                    className="min-h-[44px] flex-1 resize-none rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/90 outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.10)] placeholder:text-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={sending || !draft.trim()}
                    className="h-[44px] rounded-2xl bg-[#FF6A00]/90 px-4 text-sm font-semibold text-white shadow-[0_14px_60px_-36px_rgba(255,106,0,0.55)] transition hover:bg-[#FF6A00] disabled:opacity-40"
                  >
                    إرسال
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
