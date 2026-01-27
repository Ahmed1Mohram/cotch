"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type ThreadRow = {
  id: string;
  course_id: string;
  user_id: string;
  user_full_name: string | null;
  user_phone: string | null;
  last_message_at: string | null;
  last_message_text: string | null;
  created_at: string;
  updated_at: string;
  courses?: {
    slug: string;
    title_ar: string | null;
    title_en: string | null;
  } | null;
};

type ThreadView = {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userPhone: string;
  courseTitle: string;
  lastMessageText: string;
  updatedAt: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

function fmtTime(v: string | null | undefined) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleString("ar-EG", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function normalizeThread(row: ThreadRow): ThreadView {
  const courseTitle = String(row.courses?.title_ar ?? row.courses?.title_en ?? row.courses?.slug ?? row.course_id);
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    userId: String(row.user_id),
    userName: String(row.user_full_name ?? "مستخدم"),
    userPhone: String(row.user_phone ?? ""),
    courseTitle,
    lastMessageText: String(row.last_message_text ?? "بدون رسائل"),
    updatedAt: String(row.updated_at ?? row.last_message_at ?? row.created_at ?? ""),
  };
}

export function AdminChatScreen() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadView[]>([]);
  const [query, setQuery] = useState("");

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId) ?? null, [threads, activeThreadId]);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const loadThreads = async () => {
    setLoadingThreads(true);
    setThreadsError(null);

    const res = await supabase
      .from("chat_threads")
      .select(
        "id,course_id,user_id,user_full_name,user_phone,last_message_at,last_message_text,created_at,updated_at,courses(slug,title_ar,title_en)",
      )
      .order("updated_at", { ascending: false });

    if (res.error) {
      setThreadsError(res.error.message);
      setThreads([]);
      setLoadingThreads(false);
      return;
    }

    const list = ((res.data ?? []) as ThreadRow[]).map(normalizeThread);
    setThreads(list);
    setLoadingThreads(false);
  };

  const loadMessages = async (threadId: string) => {
    setLoadingMessages(true);
    setMessagesError(null);

    const res = await supabase
      .from("chat_messages")
      .select("id,thread_id,sender_user_id,sender_role,body,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (res.error) {
      setMessagesError(res.error.message);
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    const list: MessageRow[] = ((res.data ?? []) as any[]).map((m) => ({
      id: String(m.id),
      thread_id: String(m.thread_id),
      sender_user_id: String(m.sender_user_id),
      sender_role: m.sender_role === "admin" ? "admin" : "user",
      body: String(m.body ?? ""),
      created_at: String(m.created_at ?? ""),
    }));

    setMessages(list);
    setLoadingMessages(false);
    window.setTimeout(() => scrollToBottom(), 50);
  };

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const run = async () => {
      await loadThreads();
      if (!mounted) return;

      channel = supabase
        .channel("admin-chat-threads")
        .on("postgres_changes", { event: "*", schema: "public", table: "chat_threads" }, () => {
          void loadThreads();
        })
        .subscribe();
    };

    void run().catch((e) => {
      if (!mounted) return;
      setThreadsError(e instanceof Error ? e.message : String(e));
      setLoadingThreads(false);
    });

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (!activeThreadId) return;
    void loadMessages(activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    channel = supabase
      .channel(`admin-chat-messages-${activeThreadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${activeThreadId}` },
        (payload) => {
          const m = payload.new as any;
          const next: MessageRow = {
            id: String(m.id),
            thread_id: String(m.thread_id),
            sender_user_id: String(m.sender_user_id),
            sender_role: m.sender_role === "admin" ? "admin" : "user",
            body: String(m.body ?? ""),
            created_at: String(m.created_at ?? ""),
          };

          setMessages((prev) => (prev.some((x) => x.id === next.id) ? prev : [...prev, next]));
          window.setTimeout(() => scrollToBottom(), 50);
        },
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeThreadId, supabase]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending || !activeThreadId) return;

    setSending(true);
    setMessagesError(null);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        setMessagesError("لازم تسجيل الدخول كأدمن");
        return;
      }

      const ins = await supabase.from("chat_messages").insert({
        thread_id: activeThreadId,
        sender_user_id: user.id,
        sender_role: "admin",
        body: text,
      });

      if (ins.error) {
        setMessagesError(ins.error.message);
        return;
      }

      setDraft("");
    } finally {
      setSending(false);
    }
  };

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;

    return threads.filter((t) => {
      const hay = `${t.userName} ${t.userPhone} ${t.courseTitle} ${t.lastMessageText}`.toLowerCase();
      return hay.includes(q);
    });
  }, [threads, query]);

  if (activeThreadId && activeThread) {
    return (
      <div className="space-y-4">
        <AdminCard>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-right text-sm font-semibold text-slate-900">{activeThread.userName}</div>
              <div className="mt-1 text-right text-xs text-slate-500">
                {activeThread.courseTitle}
                {activeThread.userPhone ? <span className="mr-2">• {activeThread.userPhone}</span> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveThreadId(null)}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              aria-label="رجوع"
            >
              ←
            </button>
          </div>

          <div
            ref={listRef}
            className="mt-4 h-[62vh] overflow-auto rounded-2xl bg-slate-50 p-3 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]"
            dir="rtl"
          >
            {loadingMessages ? (
              <div className="py-8 text-center text-sm text-slate-500">تحميل...</div>
            ) : messagesError ? (
              <div className="py-8 text-center text-sm text-[#FF2424]">{messagesError}</div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">مفيش رسائل</div>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => {
                  const mine = m.sender_role === "admin";
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}> 
                      <div
                        className={cn(
                          "max-w-[86%] rounded-2xl px-4 py-3 text-sm shadow-[0_0_0_1px_rgba(2,6,23,0.08)]",
                          mine ? "bg-slate-900 text-white" : "bg-white text-slate-900",
                        )}
                      >
                        <div className="whitespace-pre-wrap text-right leading-6">{m.body}</div>
                        <div className={cn("mt-1 text-right text-[11px]", mine ? "text-white/60" : "text-slate-500")}>
                          {fmtTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-end gap-2" dir="rtl">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="اكتب ردك…"
              className="min-h-[44px] flex-1 resize-none rounded-2xl bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_0_0_1px_rgba(2,6,23,0.10)] outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
              className="h-[44px] rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
            >
              إرسال
            </button>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminCard>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-right text-sm font-semibold text-slate-900">المحادثات</div>
            <div className="mt-1 text-right text-xs text-slate-500">تابع رسائل المستخدمين في الكورسات</div>
          </div>
        </div>

        <div className="mt-4" dir="rtl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالاسم/التليفون/الكورس"
            className="h-11 w-full rounded-2xl bg-white px-4 text-sm text-slate-900 shadow-[0_0_0_1px_rgba(2,6,23,0.10)] outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="mt-4 space-y-2" dir="rtl">
          {loadingThreads ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">تحميل...</div>
          ) : threadsError ? (
            <div className="rounded-2xl bg-red-50 px-4 py-4 text-center text-sm text-[#FF2424]">{threadsError}</div>
          ) : filteredThreads.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">مفيش محادثات</div>
          ) : (
            filteredThreads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveThreadId(t.id)}
                className="w-full rounded-2xl bg-white px-4 py-4 text-right shadow-[0_0_0_1px_rgba(2,6,23,0.08)] transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{t.userName}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{t.courseTitle}</div>
                    <div className="mt-2 line-clamp-2 text-sm text-slate-700">{t.lastMessageText}</div>
                  </div>
                  <div className="flex-none text-left">
                    <div className="text-[11px] text-slate-500">{fmtTime(t.updatedAt)}</div>
                    {t.userPhone ? <div className="mt-1 text-[11px] text-slate-400">{t.userPhone}</div> : null}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </AdminCard>
    </div>
  );
}
