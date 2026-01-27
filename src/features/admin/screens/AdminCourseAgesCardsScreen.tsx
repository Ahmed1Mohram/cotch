"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { AdminCourseMonthsVideosPanel } from "@/features/admin/screens/AdminCourseMonthsVideosPanel";
import { AdminCourseMonthCodesPanel } from "@/features/admin/screens/AdminCourseMonthCodesPanel";
import { Tabs, type TabItem } from "@/features/admin/ui/Tabs";

type TabKey = "months" | "ages" | "cards" | "codes";

const tabItems: Array<TabItem<TabKey>> = [
  { key: "months", label: "الشهور والفيديوهات" },
  { key: "codes", label: "أكواد الشهور" },
  { key: "ages", label: "مجموعات الأعمار" },
  { key: "cards", label: "كروت اللاعبين" },
];

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
  description: string | null;
  theme: string | null;
  is_published: boolean;
};

type PackageRow = {
  id: string;
  slug: string;
  title: string;
};

type AgeGroupRow = {
  id: string;
  course_id: string;
  title: string | null;
  min_age: number | null;
  max_age: number | null;
  sort_order: number;
};

type PlayerCardRow = {
  id: string;
  age_group_id: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  note: string | null;
  sort_order: number;
};

function toIntOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function normalizeSlug(input: string | null | undefined) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "")
    .replace(/\.html$/, "");
}

function themeGlow(theme: string | null) {
  if (theme === "green") return "green";
  if (theme === "blue") return "blue";
  return "orange";
}

export function AdminCourseAgesCardsScreen({ slug }: { slug: string }) {
  const params = useParams<{ slug?: string | string[] }>();
  const searchParams = useSearchParams();

  const effectiveSlug = useMemo(() => {
    if (slug) return slug;
    const p = params?.slug;
    if (Array.isArray(p)) return p[0] ?? "";
    return p ?? "";
  }, [params?.slug, slug]);

  const normalizedSlug = useMemo(() => normalizeSlug(effectiveSlug), [effectiveSlug]);

  const hasValidSlug = Boolean(normalizedSlug);

  const [reloadKey, setReloadKey] = useState(0);

  const [course, setCourse] = useState<CourseRow | null>(null);
  const pkgSlug = useMemo(() => normalizeSlug(searchParams?.get("pkg")), [searchParams]);
  const [pkg, setPkg] = useState<PackageRow | null>(null);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const [ageGroups, setAgeGroups] = useState<AgeGroupRow[]>([]);
  const [playerCards, setPlayerCards] = useState<PlayerCardRow[]>([]);
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [selectedMonthNumber, setSelectedMonthNumber] = useState("1");
  const [publishing, setPublishing] = useState(false);

  const initialTab = useMemo<TabKey>(() => {
    const t = searchParams?.get("tab");
    if (t === "months" || t === "ages" || t === "cards" || t === "codes") return t;
    return "months";
  }, [searchParams]);

  const [tab, setTab] = useState<TabKey>(() => initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newAgeTitle, setNewAgeTitle] = useState("");
  const [newAgeMin, setNewAgeMin] = useState("");
  const [newAgeMax, setNewAgeMax] = useState("");

  const [editAgeTitle, setEditAgeTitle] = useState("");
  const [editAgeMin, setEditAgeMin] = useState("");
  const [editAgeMax, setEditAgeMax] = useState("");

  const [newCardAge, setNewCardAge] = useState("");
  const [newCardHeight, setNewCardHeight] = useState("");
  const [newCardWeight, setNewCardWeight] = useState("");
  const [newCardNote, setNewCardNote] = useState("");

  const [cardCodesPerCard, setCardCodesPerCard] = useState("1");
  const [cardCodesDurationDays, setCardCodesDurationDays] = useState("30");
  const [cardCodesMaxRedemptions, setCardCodesMaxRedemptions] = useState("1");
  const [generatedCodesByCardId, setGeneratedCodesByCardId] = useState<Record<string, string[]>>({});
  const [generatingCardCodes, setGeneratingCardCodes] = useState(false);
  const [copyingCardCodeId, setCopyingCardCodeId] = useState<string | null>(null);
  const [copyingAllCardCodes, setCopyingAllCardCodes] = useState(false);
  const [confirmDeleteGeneratedCardId, setConfirmDeleteGeneratedCardId] = useState<string | null>(null);
  const [deletingGeneratedCardId, setDeletingGeneratedCardId] = useState<string | null>(null);
  const [confirmDeleteAllGeneratedCardCodes, setConfirmDeleteAllGeneratedCardCodes] = useState(false);
  const [deletingAllGeneratedCardCodes, setDeletingAllGeneratedCardCodes] = useState(false);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardAge, setEditCardAge] = useState("");
  const [editCardHeight, setEditCardHeight] = useState("");
  const [editCardWeight, setEditCardWeight] = useState("");
  const [editCardNote, setEditCardNote] = useState("");

  const [confirmDeleteCardId, setConfirmDeleteCardId] = useState<string | null>(null);
  const [confirmDeleteAgeGroup, setConfirmDeleteAgeGroup] = useState(false);

  useEffect(() => {
    setPkg(null);
    setPkgError(null);

    if (!pkgSlug) return;
    if (!course?.id) return;

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (err) {
      setPkgError(err instanceof Error ? err.message : "فشل الاتصال بقاعدة البيانات");
      return;
    }

    const run = async () => {
      const pRes = await supabase.from("packages").select("id,slug,title").eq("slug", pkgSlug).maybeSingle();
      if (pRes.error || !pRes.data) {
        setPkg(null);
        setPkgError(pRes.error?.message ?? "الباقة غير موجودة");
        return;
      }

      const row = pRes.data as any;
      const candidate: PackageRow = {
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title ?? ""),
      };

      const pcRes = await supabase
        .from("package_courses")
        .select("course_id")
        .eq("package_id", candidate.id)
        .eq("course_id", course.id)
        .maybeSingle();

      if (pcRes.error || !pcRes.data) {
        setPkg(null);
        setPkgError("الكورس غير مرتبط بالباقة");
        return;
      }

      setPkg(candidate);
      setPkgError(null);
    };

    void run().catch((err) => {
      setPkg(null);
      setPkgError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    });
  }, [course?.id, pkgSlug]);

  useEffect(() => {
    if (!hasValidSlug) {
      setCourse(null);
      setAgeGroups([]);
      setPlayerCards([]);
      setSelectedAgeGroupId(null);
      setSelectedCardId(null);
      setLoading(false);
      setError("لم يتم إرسال معرّف الكورس (slug).");
      return;
    }

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الاتصال بقاعدة البيانات");
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);

      const courseRes = await supabase
        .from("courses")
        .select("id,slug,title_ar,title_en,description,theme,is_published")
        .eq("slug", normalizedSlug)
        .maybeSingle();

      if (courseRes.error || !courseRes.data) {
        setCourse(null);
        setAgeGroups([]);
        setPlayerCards([]);
        setSelectedAgeGroupId(null);
        setError(courseRes.error?.message ?? "الكورس غير موجود");
        setLoading(false);
        return;
      }

      const courseRow = courseRes.data as CourseRow;
      setCourse(courseRow);

      const agesRes = await supabase
        .from("age_groups")
        .select("id,course_id,title,min_age,max_age,sort_order,created_at")
        .eq("course_id", courseRow.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (agesRes.error) {
        setAgeGroups([]);
        setPlayerCards([]);
        setSelectedAgeGroupId(null);
        setError(agesRes.error.message);
        setLoading(false);
        return;
      }

      const ages = (agesRes.data as AgeGroupRow[]) ?? [];
      setAgeGroups(ages);

      const ageIds = ages.map((a) => a.id);
      setSelectedAgeGroupId((prev) => {
        if (prev && ageIds.includes(prev)) return prev;
        return ageIds[0] ?? null;
      });

      if (ageIds.length === 0) {
        setPlayerCards([]);
        setLoading(false);
        return;
      }

      const cardsRes = await supabase
        .from("player_cards")
        .select("id,age_group_id,age,height_cm,weight_kg,note,sort_order,created_at")
        .in("age_group_id", ageIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (cardsRes.error) {
        setPlayerCards([]);
        setError(cardsRes.error.message);
        setLoading(false);
        return;
      }

      setPlayerCards((cardsRes.data as PlayerCardRow[]) ?? []);
      setLoading(false);
    };

    void run().catch((err) => {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      setLoading(false);
    });
  }, [hasValidSlug, normalizedSlug, reloadKey]);

  const courseSlug = useMemo(() => {
    return course?.slug ? String(course.slug) : normalizedSlug;
  }, [course?.slug, normalizedSlug]);

  const toggleCoursePublished = async (next: boolean) => {
    if (!course?.id) return;

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الاتصال بقاعدة البيانات");
      return;
    }

    setPublishing(true);
    setError(null);

    const res = await supabase.from("courses").update({ is_published: next }).eq("id", course.id);

    if (res.error) setError(res.error.message);
    else setCourse((c) => (c ? { ...c, is_published: next } : c));

    setPublishing(false);
  };

  const selectedAgeGroup = useMemo(() => {
    if (!selectedAgeGroupId) return null;
    return ageGroups.find((ag) => ag.id === selectedAgeGroupId) ?? null;
  }, [ageGroups, selectedAgeGroupId]);

  useEffect(() => {
    if (!selectedAgeGroup) {
      setEditAgeTitle("");
      setEditAgeMin("");
      setEditAgeMax("");
      setConfirmDeleteAgeGroup(false);
      return;
    }

    setEditAgeTitle(selectedAgeGroup.title ?? "");
    setEditAgeMin(selectedAgeGroup.min_age === null || selectedAgeGroup.min_age === undefined ? "" : String(selectedAgeGroup.min_age));
    setEditAgeMax(selectedAgeGroup.max_age === null || selectedAgeGroup.max_age === undefined ? "" : String(selectedAgeGroup.max_age));
    setConfirmDeleteAgeGroup(false);
  }, [selectedAgeGroup?.id]);

  const cardsByAge = useMemo(() => {
    const map = new Map<string, PlayerCardRow[]>();
    for (const pc of playerCards) {
      const list = map.get(pc.age_group_id);
      if (list) list.push(pc);
      else map.set(pc.age_group_id, [pc]);
    }
    return map;
  }, [playerCards]);

  const selectedCards = useMemo(() => {
    if (!selectedAgeGroupId) return [];
    return cardsByAge.get(selectedAgeGroupId) ?? [];
  }, [cardsByAge, selectedAgeGroupId]);

  useEffect(() => {
    if (!selectedAgeGroupId) {
      setSelectedCardId(null);
      return;
    }

    if (!selectedCardId) {
      setSelectedCardId(selectedCards[0]?.id ?? null);
      return;
    }

    const stillValid = selectedCards.some((c) => c.id === selectedCardId);
    if (!stillValid) setSelectedCardId(selectedCards[0]?.id ?? null);
  }, [selectedAgeGroupId, selectedCardId, selectedCards]);

  const ageGroupCardCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const ag of ageGroups) m.set(ag.id, 0);
    for (const pc of playerCards) m.set(pc.age_group_id, (m.get(pc.age_group_id) ?? 0) + 1);
    return m;
  }, [ageGroups, playerCards]);

  const copyText = async (text: string) => {
    const t = String(text ?? "").trim();
    if (!t) return;
    if (!navigator?.clipboard?.writeText) {
      throw new Error("المتصفح لا يدعم النسخ");
    }
    await navigator.clipboard.writeText(t);
  };

  const generateCodesForAllCards = async () => {
    if (!course) return;
    if (playerCards.length === 0) return;

    const perCard = toIntOrNull(cardCodesPerCard);
    const durationDays = toIntOrNull(cardCodesDurationDays);
    const maxRedemptions = toIntOrNull(cardCodesMaxRedemptions);

    if (!perCard || perCard <= 0) return;
    if (!durationDays || durationDays <= 0) return;
    if (!maxRedemptions || maxRedemptions <= 0) return;

    const supabase = createSupabaseBrowserClient();

    setGeneratingCardCodes(true);
    setError(null);

    try {
      const next: Record<string, string[]> = {};

      for (const card of playerCards) {
        const list: string[] = [];
        for (let i = 0; i < perCard; i++) {
          const genRes = await supabase.rpc("generate_age_group_codes", {
            p_course_slug: course.slug,
            p_player_card_id: card.id,
            p_count: 1,
            p_duration_days: durationDays,
            p_max_redemptions: maxRedemptions,
          });

          if (genRes.error) {
            throw new Error(genRes.error.message);
          }

          const code = String((genRes.data as any)?.[0]?.code ?? "").trim();
          if (!code) {
            throw new Error("فشل توليد الكود");
          }

          list.push(code);
        }
        next[card.id] = list;
      }

      setGeneratedCodesByCardId(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setGeneratingCardCodes(false);
    }
  };

  const copyCodesForCard = async (cardId: string) => {
    const list = generatedCodesByCardId[cardId] ?? [];
    if (list.length === 0) return;
    setCopyingCardCodeId(cardId);
    setError(null);
    try {
      await copyText(list.join("\n"));
      const supabase = createSupabaseBrowserClient();
      const res = await supabase.from("age_group_codes").delete().in("code", list);
      if (res.error) {
        throw new Error(res.error.message);
      }
      setGeneratedCodesByCardId((prev) => ({ ...prev, [cardId]: [] }));
      setConfirmDeleteGeneratedCardId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل النسخ");
    } finally {
      setCopyingCardCodeId(null);
    }
  };

  const deleteGeneratedCodesForCard = async (cardId: string) => {
    const list = generatedCodesByCardId[cardId] ?? [];
    if (list.length === 0) return;
    setDeletingGeneratedCardId(cardId);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const res = await supabase.from("age_group_codes").delete().in("code", list);
      if (res.error) {
        throw new Error(res.error.message);
      }
      setGeneratedCodesByCardId((prev) => ({ ...prev, [cardId]: [] }));
      setConfirmDeleteGeneratedCardId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الحذف");
    } finally {
      setDeletingGeneratedCardId(null);
    }
  };

  const copyAllGeneratedCardCodes = async () => {
    const allCodes: string[] = [];
    for (const v of Object.values(generatedCodesByCardId)) {
      for (const code of v) allCodes.push(code);
    }
    if (allCodes.length === 0) return;

    setCopyingAllCardCodes(true);
    setError(null);

    try {
      await copyText(allCodes.join("\n"));
      const supabase = createSupabaseBrowserClient();
      const res = await supabase.from("age_group_codes").delete().in("code", allCodes);
      if (res.error) {
        throw new Error(res.error.message);
      }
      setGeneratedCodesByCardId({});
      setConfirmDeleteAllGeneratedCardCodes(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل النسخ");
    } finally {
      setCopyingAllCardCodes(false);
    }
  };

  const deleteAllGeneratedCardCodes = async () => {
    const allCodes: string[] = [];
    for (const v of Object.values(generatedCodesByCardId)) {
      for (const code of v) allCodes.push(code);
    }
    if (allCodes.length === 0) return;

    setDeletingAllGeneratedCardCodes(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const res = await supabase.from("age_group_codes").delete().in("code", allCodes);
      if (res.error) {
        throw new Error(res.error.message);
      }
      setGeneratedCodesByCardId({});
      setConfirmDeleteAllGeneratedCardCodes(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الحذف");
    } finally {
      setDeletingAllGeneratedCardCodes(false);
    }
  };

  const addAgeGroup = async () => {
    if (!course) return;
    const title = newAgeTitle.trim();
    if (!title) return;

    const min = newAgeMin.trim() ? Number(newAgeMin) : null;
    const max = newAgeMax.trim() ? Number(newAgeMax) : null;
    if (newAgeMin.trim() && Number.isNaN(min)) return;
    if (newAgeMax.trim() && Number.isNaN(max)) return;

    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    const nextSort = Math.max(-1, ...ageGroups.map((a) => a.sort_order ?? 0)) + 1;

    const res = await supabase.from("age_groups").insert({
      course_id: course.id,
      title,
      min_age: min,
      max_age: max,
      sort_order: nextSort,
    });

    if (res.error) setError(res.error.message);
    else {
      setNewAgeTitle("");
      setNewAgeMin("");
      setNewAgeMax("");
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  const updateSelectedAgeGroup = async () => {
    if (!selectedAgeGroupId) return;

    const title = editAgeTitle.trim() ? editAgeTitle.trim() : null;
    const min = editAgeMin.trim() ? Number(editAgeMin) : null;
    const max = editAgeMax.trim() ? Number(editAgeMax) : null;

    if (editAgeMin.trim() && Number.isNaN(min)) return;
    if (editAgeMax.trim() && Number.isNaN(max)) return;

    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    const res = await supabase
      .from("age_groups")
      .update({ title, min_age: min, max_age: max })
      .eq("id", selectedAgeGroupId);

    if (res.error) setError(res.error.message);
    else {
      setConfirmDeleteCardId(null);
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  const deleteAgeGroup = async (ageGroupId: string) => {
    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    const res = await supabase.from("age_groups").delete().eq("id", ageGroupId);

    if (res.error) setError(res.error.message);
    else {
      setConfirmDeleteAgeGroup(false);
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  const addPlayerCard = async () => {
    if (!selectedAgeGroupId) return;

    const age = newCardAge.trim() ? Number(newCardAge) : null;
    const height = newCardHeight.trim() ? Number(newCardHeight) : null;
    const weight = newCardWeight.trim() ? Number(newCardWeight) : null;
    const note = newCardNote.trim() ? newCardNote.trim() : null;

    if (newCardAge.trim() && Number.isNaN(age)) return;
    if (newCardHeight.trim() && Number.isNaN(height)) return;
    if (newCardWeight.trim() && Number.isNaN(weight)) return;

    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    const nextSort = Math.max(
      -1,
      ...playerCards.filter((pc) => pc.age_group_id === selectedAgeGroupId).map((pc) => pc.sort_order ?? 0),
    ) + 1;

    const res = await supabase.from("player_cards").insert({
      age_group_id: selectedAgeGroupId,
      age,
      height_cm: height,
      weight_kg: weight,
      note,
      sort_order: nextSort,
    });

    if (res.error) setError(res.error.message);
    else {
      setNewCardAge("");
      setNewCardHeight("");
      setNewCardWeight("");
      setNewCardNote("");
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  const startEditCard = (card: PlayerCardRow) => {
    setEditingCardId(card.id);
    setEditCardAge(card.age === null || card.age === undefined ? "" : String(card.age));
    setEditCardHeight(card.height_cm === null || card.height_cm === undefined ? "" : String(card.height_cm));
    setEditCardWeight(card.weight_kg === null || card.weight_kg === undefined ? "" : String(card.weight_kg));
    setEditCardNote(card.note ?? "");
  };

  const cancelEditCard = () => {
    setEditingCardId(null);
    setEditCardAge("");
    setEditCardHeight("");
    setEditCardWeight("");
    setEditCardNote("");
  };

  const updateEditingCard = async () => {
    if (!editingCardId) return;

    const age = editCardAge.trim() ? Number(editCardAge) : null;
    const height = editCardHeight.trim() ? Number(editCardHeight) : null;
    const weight = editCardWeight.trim() ? Number(editCardWeight) : null;
    const note = editCardNote.trim() ? editCardNote.trim() : null;

    if (editCardAge.trim() && Number.isNaN(age)) return;
    if (editCardHeight.trim() && Number.isNaN(height)) return;
    if (editCardWeight.trim() && Number.isNaN(weight)) return;

    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    const res = await supabase
      .from("player_cards")
      .update({ age, height_cm: height, weight_kg: weight, note })
      .eq("id", editingCardId);

    if (res.error) setError(res.error.message);
    else {
      cancelEditCard();
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  const deletePlayerCard = async (playerCardId: string) => {
    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    setError(null);

    const res = await supabase.from("player_cards").delete().eq("id", playerCardId);

    if (res.error) setError(res.error.message);
    else {
      setConfirmDeleteCardId(null);
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  if (!hasValidSlug) {
    return (
      <AdminCard>
        <div className="text-lg font-semibold text-slate-900" dir="rtl">
          خطأ في الرابط
        </div>
        <div className="mt-2 text-sm text-slate-600" dir="rtl">
          لم يتم إرسال معرّف الكورس (slug).
        </div>
        <div className="mt-6">
          <Link
            href="/admin/courses"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-900 border border-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            رجوع للكورسات
          </Link>
        </div>
      </AdminCard>
    );
  }

  if (!course && !loading) {
    return (
      <AdminCard>
        <div className="text-lg font-semibold text-slate-900" dir="rtl">
          الكورس غير موجود
        </div>
        <div className="mt-2 text-sm text-slate-600" dir="rtl">
          {error ? error : `المعرّف (slug) غير صحيح: ${slug}`}
        </div>
        <div className="mt-6">
          <Link
            href="/admin/courses"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-900 border border-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            رجوع للكورسات
          </Link>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <AdminCard glow={themeGlow(course?.theme ?? null)}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-5">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-slate-600">الكورس</div>
            <div className="mt-1.5 sm:mt-2 text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 break-words">
              {course?.title_ar ?? course?.title_en ?? course?.slug ?? normalizedSlug}
            </div>
            {course?.title_en ? (
              <div className="mt-1 text-xs text-slate-500" dir="ltr">
                {course.title_en}
              </div>
            ) : null}
            <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600 break-words">{course?.description ?? ""}</div>
          </div>

          <div className="flex flex-col items-end sm:items-end gap-2.5 sm:gap-3 shrink-0">
            <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
              {pkg ? (
                <Link
                  href={`/admin/packages/${encodeURIComponent(pkg.slug)}`}
                  className="inline-flex h-9 sm:h-10 items-center justify-center rounded-2xl bg-white px-3 sm:px-4 text-[11px] sm:text-xs font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50"
                >
                  {pkg.title}
                </Link>
              ) : null}
              <Link
                href={`/admin/courses/${courseSlug}/subscribers`}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-xs font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50"
              >
                مشتركين الكورس
              </Link>
              <div
                className={cn(
                  "rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs border",
                  course?.is_published
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200",
                )}
              >
                {course?.is_published ? "منشور" : "غير منشور"}
              </div>
              <label className="inline-flex h-9 sm:h-10 items-center gap-2 sm:gap-3 rounded-2xl bg-white px-3 sm:px-4 text-xs text-slate-700 border border-slate-200">
                <span className="font-medium text-slate-900 text-[11px] sm:text-xs">نشر الكورس</span>
                <input
                  type="checkbox"
                  checked={Boolean(course?.is_published)}
                  onChange={(e) => toggleCoursePublished(e.target.checked)}
                  disabled={publishing || loading || !course}
                  className="h-4 w-4 sm:h-5 sm:w-5 accent-slate-700"
                />
              </label>
            </div>
            <Link
              href="/admin/courses"
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              رجوع
            </Link>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <Tabs items={tabItems} value={tab} onChange={setTab} />
          </div>
          {error ? <div className="text-xs text-rose-700 break-words shrink-0">{error}</div> : pkgError ? (
            <div className="text-xs text-rose-700 break-words shrink-0">{pkgError}</div>
          ) : null}
        </div>
      </AdminCard>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <AdminCard>
            <div className="text-xs font-semibold text-slate-700">مجموعات الأعمار</div>
            <div className="mt-4 space-y-2">
              {ageGroups.map((ag) => {
                const active = ag.id === selectedAgeGroupId;
                return (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => setSelectedAgeGroupId(ag.id)}
                    className={cn(
                      "w-full rounded-2xl px-4 py-3 text-right transition border",
                      active
                        ? "bg-slate-50 text-slate-900 border-slate-300"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{ag.title ?? "مجموعة عمر"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {ag.min_age ?? "—"}–{ag.max_age ?? "—"} سنة
                        </div>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-700 border border-slate-200">
                        {(ageGroupCardCounts.get(ag.id) ?? 0).toString()} كارت
                      </div>
                    </div>
                  </button>
                );
              })}

              {ageGroups.length === 0 && !loading ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">
                  مفيش مجموعات أعمار لسه.
                </div>
              ) : null}
            </div>
          </AdminCard>

          {selectedAgeGroup ? (
            <AdminCard>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-700">إحصائيات سريعة</div>
              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-2.5 sm:px-3 py-2.5 sm:py-3 border border-slate-200">
                  كروت
                  <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{selectedCards.length}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-2.5 sm:px-3 py-2.5 sm:py-3 border border-slate-200">
                  مجموعة عمر
                  <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">1</div>
                </div>
              </div>
            </AdminCard>
          ) : null}
        </div>

        <div className="space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden">
          {tab === "ages" ? (
          <AdminCard>
            <div className="text-base sm:text-lg font-semibold text-slate-900">1) مجموعات الأعمار</div>
            <div className="mt-2 text-sm text-slate-600 break-words">أضف مجموعة عمر للكورس ثم عدّل/احذف المجموعة المحددة.</div>

            <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_110px_110px_120px]">
              <input
                value={newAgeTitle}
                onChange={(e) => setNewAgeTitle(e.target.value)}
                placeholder="اسم المجموعة"
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              />
              <input
                value={newAgeMin}
                onChange={(e) => setNewAgeMin(e.target.value)}
                placeholder="من"
                inputMode="numeric"
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              />
              <input
                value={newAgeMax}
                onChange={(e) => setNewAgeMax(e.target.value)}
                placeholder="إلى"
                inputMode="numeric"
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              />
              <button
                type="button"
                onClick={addAgeGroup}
                disabled={saving || loading || !course}
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                إضافة
              </button>
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-5 border border-slate-200">
              <div className="text-xs font-semibold text-slate-700">تعديل المجموعة المحددة</div>
              <div className="mt-1 text-xs text-slate-600">اختر مجموعة من القائمة على اليمين ثم عدّل بياناتها.</div>

              <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_120px_120px]">
                <input
                  value={editAgeTitle}
                  onChange={(e) => setEditAgeTitle(e.target.value)}
                  placeholder="اسم المجموعة"
                  disabled={!selectedAgeGroupId}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
                />
                <input
                  value={editAgeMin}
                  onChange={(e) => setEditAgeMin(e.target.value)}
                  placeholder="من"
                  inputMode="numeric"
                  disabled={!selectedAgeGroupId}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
                />
                <input
                  value={editAgeMax}
                  onChange={(e) => setEditAgeMax(e.target.value)}
                  placeholder="إلى"
                  inputMode="numeric"
                  disabled={!selectedAgeGroupId}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={updateSelectedAgeGroup}
                  disabled={saving || !selectedAgeGroupId}
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                >
                  حفظ التعديل
                </button>

                {confirmDeleteAgeGroup ? (
                  <>
                    <button
                      type="button"
                      onClick={() => selectedAgeGroupId && deleteAgeGroup(selectedAgeGroupId)}
                      disabled={saving || !selectedAgeGroupId}
                      className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                    >
                      تأكيد الحذف
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAgeGroup(false)}
                      disabled={saving}
                      className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAgeGroup(true)}
                    disabled={saving || !selectedAgeGroupId}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-5 text-sm font-medium text-rose-700 border border-rose-200 shadow-sm transition enabled:hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                  >
                    حذف المجموعة
                  </button>
                )}

                <div className="text-xs text-slate-500">
                  {selectedAgeGroupId ? "التعديل يتم حفظه في قاعدة البيانات" : "اختر مجموعة أولاً"}
                </div>
              </div>
            </div>
          </AdminCard>

          ) : null}

          {tab === "cards" ? (
          <AdminCard>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-base md:text-lg font-semibold text-slate-900">2) الكروت</div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600 break-words">
                  {selectedAgeGroup ? (
                    <>
                      المجموعة: <span className="font-semibold text-slate-900">{selectedAgeGroup.title ?? "مجموعة عمر"}</span>
                    </>
                  ) : (
                    "اختر مجموعة عمر أولاً"
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setTab("months");
                    window.setTimeout(() => {
                      document.getElementById("admin-months-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 0);
                  }}
                  disabled={!selectedAgeGroupId}
                  className="inline-flex h-9 sm:h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 sm:px-5 text-xs sm:text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                >
                  فتح تبويب الشهور والفيديوهات
                </button>
                <div className="text-[11px] sm:text-xs text-slate-500">{loading ? "تحميل..." : ""}</div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-3 sm:px-4 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900">أكواد اشتراك للكروت</div>
                  <div className="mt-1 text-[11px] sm:text-xs text-slate-600 break-words">هيتم توليد كود تفعيل لكل كارت (كود كارت) علشان يفتح نفس الكارت للمستخدم.</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={copyAllGeneratedCardCodes}
                    disabled={
                      generatingCardCodes ||
                      copyingAllCardCodes ||
                      deletingAllGeneratedCardCodes ||
                      Object.values(generatedCodesByCardId).every((list) => !list?.length)
                    }
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-sm font-medium text-slate-900 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                  >
                    {copyingAllCardCodes ? "جاري النسخ..." : "نسخ كل الأكواد"}
                  </button>

                  {confirmDeleteAllGeneratedCardCodes ? (
                    <>
                      <button
                        type="button"
                        onClick={deleteAllGeneratedCardCodes}
                        disabled={
                          generatingCardCodes ||
                          copyingAllCardCodes ||
                          deletingAllGeneratedCardCodes ||
                          Object.values(generatedCodesByCardId).every((list) => !list?.length)
                        }
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                      >
                        {deletingAllGeneratedCardCodes ? "حذف..." : "تأكيد حذف الكل"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAllGeneratedCardCodes(false)}
                        disabled={deletingAllGeneratedCardCodes}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                      >
                        إلغاء
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAllGeneratedCardCodes(true)}
                      disabled={
                        generatingCardCodes ||
                        copyingAllCardCodes ||
                        deletingAllGeneratedCardCodes ||
                        Object.values(generatedCodesByCardId).every((list) => !list?.length)
                      }
                      className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-50 px-4 text-sm font-medium text-rose-700 border border-rose-200 shadow-sm transition enabled:hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                    >
                      حذف كل الأكواد
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={generateCodesForAllCards}
                    disabled={
                      generatingCardCodes ||
                      copyingAllCardCodes ||
                      deletingAllGeneratedCardCodes ||
                      !course ||
                      playerCards.length === 0
                    }
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                  >
                    {generatingCardCodes ? "جاري التوليد..." : "توليد كود لكل الكروت"}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <input
                  value={cardCodesPerCard}
                  onChange={(e) => setCardCodesPerCard(e.target.value)}
                  placeholder="عدد الأكواد لكل كارت"
                  inputMode="numeric"
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                />
                <input
                  value={cardCodesDurationDays}
                  onChange={(e) => setCardCodesDurationDays(e.target.value)}
                  placeholder="مدة الاشتراك (بالأيام)"
                  inputMode="numeric"
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                />
                <input
                  value={cardCodesMaxRedemptions}
                  onChange={(e) => setCardCodesMaxRedemptions(e.target.value)}
                  placeholder="عدد مرات استخدام الكود"
                  inputMode="numeric"
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-6 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-[90px_110px_110px_1fr_120px]">
              <input
                value={newCardAge}
                onChange={(e) => setNewCardAge(e.target.value)}
                placeholder="العمر"
                inputMode="numeric"
                disabled={!selectedAgeGroupId}
                className="h-9 sm:h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />
              <input
                value={newCardHeight}
                onChange={(e) => setNewCardHeight(e.target.value)}
                placeholder="الطول"
                inputMode="numeric"
                disabled={!selectedAgeGroupId}
                className="h-9 sm:h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />
              <input
                value={newCardWeight}
                onChange={(e) => setNewCardWeight(e.target.value)}
                placeholder="الوزن"
                inputMode="numeric"
                disabled={!selectedAgeGroupId}
                className="h-9 sm:h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />
              <input
                value={newCardNote}
                onChange={(e) => setNewCardNote(e.target.value)}
                placeholder="عنوان/تفاصيل"
                disabled={!selectedAgeGroupId}
                className="h-9 sm:h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={addPlayerCard}
                disabled={saving || !selectedAgeGroupId}
                className="inline-flex h-9 sm:h-10 w-full sm:w-auto items-center justify-center rounded-2xl bg-slate-900 px-4 sm:px-5 text-xs sm:text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 col-span-1 sm:col-span-2 md:col-span-1"
              >
                إضافة كارت
              </button>
            </div>

            <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
              {selectedCards.map((card) => {
                const isEditing = editingCardId === card.id;
                const isSelected = selectedCardId === card.id;
                const generatedCodes = generatedCodesByCardId[card.id] ?? [];
                return (
                  <div
                    key={card.id}
                    className={cn(
                      "rounded-2xl border bg-white p-3 sm:p-4",
                      isSelected ? "border-slate-300 bg-slate-50" : "border-slate-200",
                    )}
                  >
                    {!isEditing ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
                        <div className="text-xs sm:text-sm text-slate-700 break-words">
                          <span className="font-semibold text-slate-900">عمر:</span> {card.age ?? "—"} |{" "}
                          <span className="font-semibold text-slate-900">طول:</span> {card.height_cm ?? "—"} |{" "}
                          <span className="font-semibold text-slate-900">وزن:</span> {card.weight_kg ?? "—"}
                          {card.note ? <span className="text-slate-500"> — {card.note}</span> : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                          {confirmDeleteCardId === card.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => deletePlayerCard(card.id)}
                                disabled={saving}
                                className="inline-flex h-9 sm:h-10 items-center justify-center rounded-2xl bg-rose-600 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white shadow-sm transition enabled:hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                              >
                                تأكيد
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCardId(null)}
                                disabled={saving}
                                className="inline-flex h-9 sm:h-10 items-center justify-center rounded-2xl bg-white px-3 sm:px-4 text-xs sm:text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                              >
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCardId(card.id);
                                  setTab("months");
                                  window.setTimeout(() => {
                                    document
                                      .getElementById("admin-months-panel")
                                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }, 0);
                                }}
                                disabled={saving}
                                className="inline-flex h-9 sm:h-10 items-center justify-center rounded-2xl bg-slate-900 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                              >
                                اختيار
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditCard(card)}
                                disabled={saving}
                                className="inline-flex h-9 sm:h-10 items-center justify-center rounded-2xl bg-slate-100 px-3 sm:px-4 text-xs sm:text-sm font-medium text-slate-900 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                              >
                                تعديل
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDeleteCardId(card.id);
                                }}
                                disabled={saving}
                                className="inline-flex h-9 sm:h-10 items-center justify-center rounded-2xl bg-white px-3 sm:px-4 text-xs sm:text-sm font-medium text-rose-700 border border-rose-200 shadow-sm transition enabled:hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                              >
                                حذف
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-[90px_110px_110px_1fr]">
                          <input
                            value={editCardAge}
                            onChange={(e) => setEditCardAge(e.target.value)}
                            placeholder="العمر"
                            inputMode="numeric"
                            className="h-9 sm:h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                          />
                          <input
                            value={editCardHeight}
                            onChange={(e) => setEditCardHeight(e.target.value)}
                            placeholder="الطول"
                            inputMode="numeric"
                            className="h-9 sm:h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                          />
                          <input
                            value={editCardWeight}
                            onChange={(e) => setEditCardWeight(e.target.value)}
                            placeholder="الوزن"
                            inputMode="numeric"
                            className="h-9 sm:h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                          />
                          <input
                            value={editCardNote}
                            onChange={(e) => setEditCardNote(e.target.value)}
                            placeholder="عنوان/تفاصيل"
                            className="h-9 sm:h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={updateEditingCard}
                            disabled={saving}
                            className="inline-flex h-9 sm:h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 sm:px-5 text-xs sm:text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditCard}
                            disabled={saving}
                            className="inline-flex h-9 sm:h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 sm:px-5 text-xs sm:text-sm font-medium text-slate-900 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}

                    {generatedCodes.length ? (
                      <div className="mt-3 rounded-2xl bg-white px-4 py-3 border border-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs font-semibold text-slate-900">أكواد هذا الكارت</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copyCodesForCard(card.id)}
                              disabled={copyingCardCodeId === card.id || deletingGeneratedCardId === card.id}
                              className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-100 px-4 text-xs font-medium text-slate-900 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                            >
                              {copyingCardCodeId === card.id ? "جاري النسخ..." : "نسخ"}
                            </button>

                            {confirmDeleteGeneratedCardId === card.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => deleteGeneratedCodesForCard(card.id)}
                                  disabled={copyingCardCodeId === card.id || deletingGeneratedCardId === card.id}
                                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-rose-600 px-4 text-xs font-medium text-white shadow-sm transition enabled:hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                                >
                                  {deletingGeneratedCardId === card.id ? "حذف..." : "تأكيد"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteGeneratedCardId(null)}
                                  disabled={deletingGeneratedCardId === card.id}
                                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-white px-4 text-xs font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                                >
                                  إلغاء
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteGeneratedCardId(card.id)}
                                disabled={copyingCardCodeId === card.id || deletingGeneratedCardId === card.id}
                                className="inline-flex h-9 items-center justify-center rounded-2xl bg-rose-50 px-4 text-xs font-medium text-rose-700 border border-rose-200 shadow-sm transition enabled:hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                              >
                                حذف
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 space-y-1">
                          {generatedCodes.map((code) => (
                            <div key={code} className="font-mono text-xs text-slate-700">{code}</div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {selectedAgeGroupId && selectedCards.length === 0 && !loading ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">
                  مفيش كروت في المجموعة دي لسه.
                </div>
              ) : null}
            </div>
          </AdminCard>

          ) : null}

          {tab === "months" ? (
            <div id="admin-months-panel" className="scroll-mt-24 space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600 border border-slate-200">
                {selectedAgeGroup ? (
                  <>
                    المجموعة الحالية: <span className="font-semibold text-slate-900">{selectedAgeGroup.title ?? "مجموعة عمر"}</span>
                    {selectedMonthNumber ? (
                      <>
                        {" "}— الشهر: <span className="font-semibold text-slate-900">{selectedMonthNumber}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  "اختر مجموعة عمر أولاً"
                )}
              </div>
              <AdminCourseMonthsVideosPanel
                ageGroupId={selectedAgeGroupId}
                packageId={pkg ? pkg.id : null}
                onMonthNumberChange={setSelectedMonthNumber}
              />
            </div>
          ) : null}

          {tab === "codes" ? (
            <div id="admin-months-codes-panel" className="scroll-mt-24">
              <AdminCourseMonthCodesPanel
                courseId={course?.id ?? null}
                courseSlug={courseSlug}
                monthNumber={selectedMonthNumber}
                onMonthNumberChange={setSelectedMonthNumber}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
