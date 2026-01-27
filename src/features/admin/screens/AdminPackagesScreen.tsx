"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type PackageRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  price_egp: number | null;
  offer_active: boolean;
  offer_badge: string | null;
  offer_price_egp: number | null;
  offer_percent: number | null;
  offer_start_at: string | null;
  offer_end_at: string | null;
  features: unknown;
  theme: string;
  sort_order: number;
  active: boolean;
  created_at: string;
};

function toIntOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function toNumOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toIsoOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const d = new Date(s);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return null;
  return d.toISOString();
}

function toDatetimeLocalValue(v: string | null) {
  if (!v) return "";
  const d = new Date(v);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return "";
  return d.toISOString().slice(0, 16);
}

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
  created_at: string;
};

type PackageCourseRow = {
  package_id: string;
  course_id: string;
  sort_order: number;
  created_at: string;
};

type AgeGroupRow = {
  id: string;
  title: string | null;
  min_age: number | null;
  max_age: number | null;
  sort_order: number;
  created_at: string;
};

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function linesToFeatures(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return lines;
}

function featuresToLines(features: unknown) {
  if (!features) return "";
  if (!Array.isArray(features)) return "";
  return features.map((x) => String(x)).filter(Boolean).join("\n");
}

export function AdminPackagesScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);

  const [confirmApplyFeaturePresets, setConfirmApplyFeaturePresets] = useState(false);

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);

  const pushNotice = (kind: "success" | "error" | "info", text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [packageCourses, setPackageCourses] = useState<PackageCourseRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [ageGroups, setAgeGroups] = useState<AgeGroupRow[]>([]);
  const [allowedAgeGroupIds, setAllowedAgeGroupIds] = useState<Set<string>>(new Set());

  const [courseQuery, setCourseQuery] = useState("");
  const [confirmRemoveCourseId, setConfirmRemoveCourseId] = useState<string | null>(null);
  const [pendingCourseAdds, setPendingCourseAdds] = useState<Set<string>>(new Set());
  const [confirmDeletePackageId, setConfirmDeletePackageId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newTheme, setNewTheme] = useState<"orange" | "blue" | "vip">("orange");
  const [newSort, setNewSort] = useState("");
  const [newActive, setNewActive] = useState(true);
  const [newDescription, setNewDescription] = useState("");
  const [newFeatures, setNewFeatures] = useState("");
  const [newOfferActive, setNewOfferActive] = useState(false);
  const [newOfferBadge, setNewOfferBadge] = useState("");
  const [newOfferPrice, setNewOfferPrice] = useState("");
  const [newOfferPercent, setNewOfferPercent] = useState("");
  const [newOfferStartAt, setNewOfferStartAt] = useState("");
  const [newOfferEndAt, setNewOfferEndAt] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editTheme, setEditTheme] = useState<"orange" | "blue" | "vip">("orange");
  const [editSort, setEditSort] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editDescription, setEditDescription] = useState("");
  const [editFeatures, setEditFeatures] = useState("");
  const [editOfferActive, setEditOfferActive] = useState(false);
  const [editOfferBadge, setEditOfferBadge] = useState("");
  const [editOfferPrice, setEditOfferPrice] = useState("");
  const [editOfferPercent, setEditOfferPercent] = useState("");
  const [editOfferStartAt, setEditOfferStartAt] = useState("");
  const [editOfferEndAt, setEditOfferEndAt] = useState("");

  const getSupabase = () => {
    try {
      return createSupabaseBrowserClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الاتصال بقاعدة البيانات");
      return null;
    }
  };

  const fetchPackages = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    const res = await supabase
      .from("packages")
      .select("id,slug,title,subtitle,description,badge,price_egp,offer_active,offer_badge,offer_price_egp,offer_percent,offer_start_at,offer_end_at,features,theme,sort_order,active,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (res.error) {
      setPackages([]);
      setError(res.error.message);
      setLoading(false);
      return;
    }

    const list: PackageRow[] = ((res.data as any[]) ?? []).map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title ?? ""),
      subtitle: r.subtitle ?? null,
      description: r.description ?? null,
      badge: r.badge ?? null,
      price_egp: r.price_egp === null || r.price_egp === undefined ? null : Number(r.price_egp),
      offer_active: Boolean((r as any).offer_active),
      offer_badge: (r as any).offer_badge ?? null,
      offer_price_egp:
        (r as any).offer_price_egp === null || (r as any).offer_price_egp === undefined
          ? null
          : Number((r as any).offer_price_egp),
      offer_percent:
        (r as any).offer_percent === null || (r as any).offer_percent === undefined
          ? null
          : Number((r as any).offer_percent),
      offer_start_at: (r as any).offer_start_at ? String((r as any).offer_start_at) : null,
      offer_end_at: (r as any).offer_end_at ? String((r as any).offer_end_at) : null,
      features: (r as any).features,
      theme: String(r.theme ?? "orange"),
      sort_order: Number(r.sort_order ?? 0),
      active: Boolean(r.active),
      created_at: String(r.created_at ?? ""),
    }));

    setPackages(list);
    setLoading(false);
  };

  const fetchCourses = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    const res = await supabase
      .from("courses")
      .select("id,slug,title_ar,title_en,created_at")
      .order("created_at", { ascending: true });

    if (res.error) {
      setCourses([]);
      setError(res.error.message);
      return;
    }

    const list: CourseRow[] = ((res.data as any[]) ?? []).map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title_ar: (r as any).title_ar ?? null,
      title_en: (r as any).title_en ?? null,
      created_at: String((r as any).created_at ?? ""),
    }));

    setCourses(list);
  };

  const refreshPackageCourses = async (packageId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const res = await supabase
      .from("package_courses")
      .select("package_id,course_id,sort_order,created_at")
      .eq("package_id", packageId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (res.error) {
      setPackageCourses([]);
      setError(res.error.message);
      return;
    }

    const list: PackageCourseRow[] = ((res.data as any[]) ?? []).map((r) => ({
      package_id: String(r.package_id),
      course_id: String(r.course_id),
      sort_order: Number(r.sort_order ?? 0),
      created_at: String((r as any).created_at ?? ""),
    }));

    setPackageCourses(list);
    setSelectedCourseId((prev) => {
      if (prev && list.some((x) => x.course_id === prev)) return prev;
      return list[0]?.course_id ?? "";
    });
  };

  const refreshAgeGroups = async (packageId: string, courseId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const [agRes, allowedRes] = await Promise.all([
      supabase
        .from("age_groups")
        .select("id,title,min_age,max_age,sort_order,created_at")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("package_course_age_groups")
        .select("age_group_id")
        .eq("package_id", packageId)
        .eq("course_id", courseId),
    ]);

    if (agRes.error) {
      setAgeGroups([]);
      setError(agRes.error.message);
      return;
    }

    if (allowedRes.error) {
      setAllowedAgeGroupIds(new Set());
      setError(allowedRes.error.message);
      return;
    }

    const list: AgeGroupRow[] = ((agRes.data as any[]) ?? []).map((r) => ({
      id: String(r.id),
      title: (r as any).title ?? null,
      min_age: (r as any).min_age ?? null,
      max_age: (r as any).max_age ?? null,
      sort_order: Number((r as any).sort_order ?? 0),
      created_at: String((r as any).created_at ?? ""),
    }));

    const allowSet = new Set<string>(((allowedRes.data as any[]) ?? []).map((r) => String(r.age_group_id)).filter(Boolean));

    setAgeGroups(list);
    setAllowedAgeGroupIds(allowSet);
  };

  useEffect(() => {
    void fetchPackages();
    void fetchCourses();
  }, []);

  useEffect(() => {
    setPackageCourses([]);
    setSelectedCourseId("");
    setAgeGroups([]);
    setAllowedAgeGroupIds(new Set());
    setConfirmRemoveCourseId(null);
    setPendingCourseAdds(new Set());

    const pid = selectedPackageId.trim();
    if (!pid) return;

    void refreshPackageCourses(pid);
  }, [selectedPackageId]);

  useEffect(() => {
    setAgeGroups([]);
    setAllowedAgeGroupIds(new Set());

    const pid = selectedPackageId.trim();
    const cid = selectedCourseId.trim();
    if (!pid || !cid) return;

    void refreshAgeGroups(pid, cid);
  }, [selectedPackageId, selectedCourseId]);

  const sorted = useMemo(() => packages, [packages]);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );
  const courseIdsInPackage = useMemo(() => new Set(packageCourses.map((x) => x.course_id)), [packageCourses]);

  const filteredCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const slug = (c.slug ?? "").toLowerCase();
      const title = (c.title_ar ?? "").toLowerCase();
      const titleEn = (c.title_en ?? "").toLowerCase();
      return slug.includes(q) || title.includes(q) || titleEn.includes(q);
    });
  }, [courseQuery, courses]);

  const resetCreate = () => {
    setNewTitle("");
    setNewSlug("");
    setNewSubtitle("");
    setNewBadge("");
    setNewPrice("");
    setNewTheme("orange");
    setNewSort("");
    setNewActive(true);
    setNewDescription("");
    setNewFeatures("");
    setNewOfferActive(false);
    setNewOfferBadge("");
    setNewOfferPrice("");
    setNewOfferPercent("");
    setNewOfferStartAt("");
    setNewOfferEndAt("");
  };

  const createPackage = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    const title = newTitle.trim();
    if (!title) {
      setError("اكتب اسم الباقة.");
      setNotice(null);
      return;
    }

    const slug = normalizeSlug(newSlug.trim() || title);
    if (!slug) {
      setError("اكتب slug صالح.");
      setNotice(null);
      return;
    }

    const sortOrder = newSort.trim() ? Number(newSort.trim()) : 0;
    const price = toNumOrNull(newPrice);
    const offerPrice = toNumOrNull(newOfferPrice);
    const offerPercent = toIntOrNull(newOfferPercent);
    const offerStartAt = toIsoOrNull(newOfferStartAt);
    const offerEndAt = toIsoOrNull(newOfferEndAt);

    setSaving(true);
    setError(null);
    setNotice(null);

    const res = await supabase
      .from("packages")
      .insert({
      slug,
      title,
      subtitle: newSubtitle.trim() || null,
      description: newDescription.trim() || null,
      badge: newBadge.trim() || null,
      price_egp: Number.isFinite(price as any) ? price : null,
      offer_active: Boolean(newOfferActive),
      offer_badge: newOfferBadge.trim() || null,
      offer_price_egp: Number.isFinite(offerPrice as any) ? offerPrice : null,
      offer_percent: typeof offerPercent === "number" && offerPercent > 0 && offerPercent <= 100 ? offerPercent : null,
      offer_start_at: offerStartAt,
      offer_end_at: offerEndAt,
      features: linesToFeatures(newFeatures),
      theme: newTheme,
      sort_order: Number.isFinite(sortOrder as any) ? sortOrder : 0,
      active: Boolean(newActive),
      })
      .select("id");

    if (res.error) {
      setError(res.error.message);
      setSaving(false);
      return;
    }

    resetCreate();
    setCreateOpen(false);
    await fetchPackages();
    setSaving(false);
    pushNotice("success", "تم إنشاء الباقة.");
  };

  const startEdit = (p: PackageRow) => {
    setConfirmDeletePackageId(null);
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditSubtitle(p.subtitle ?? "");
    setEditBadge(p.badge ?? "");
    setEditPrice(p.price_egp === null ? "" : String(p.price_egp));
    setEditTheme((p.theme === "vip" || p.theme === "blue" || p.theme === "orange" ? p.theme : "orange") as any);
    setEditSort(String(p.sort_order ?? 0));
    setEditActive(Boolean(p.active));
    setEditDescription(p.description ?? "");
    setEditFeatures(featuresToLines(p.features));
    setEditOfferActive(Boolean(p.offer_active));
    setEditOfferBadge(p.offer_badge ?? "");
    setEditOfferPrice(p.offer_price_egp === null ? "" : String(p.offer_price_egp));
    setEditOfferPercent(p.offer_percent === null ? "" : String(p.offer_percent));
    setEditOfferStartAt(toDatetimeLocalValue(p.offer_start_at));
    setEditOfferEndAt(toDatetimeLocalValue(p.offer_end_at));
  };

  const cancelEdit = () => {
    setConfirmDeletePackageId(null);
    setEditingId(null);
    setEditTitle("");
    setEditSubtitle("");
    setEditBadge("");
    setEditPrice("");
    setEditTheme("orange");
    setEditSort("");
    setEditActive(true);
    setEditDescription("");
    setEditFeatures("");
    setEditOfferActive(false);
    setEditOfferBadge("");
    setEditOfferPrice("");
    setEditOfferPercent("");
    setEditOfferStartAt("");
    setEditOfferEndAt("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const title = editTitle.trim();
    if (!title) {
      setError("اسم الباقة لا يمكن أن يكون فارغ.");
      setNotice(null);
      return;
    }

    const sortOrder = editSort.trim() ? Number(editSort.trim()) : 0;
    const price = toNumOrNull(editPrice);
    const offerPrice = toNumOrNull(editOfferPrice);
    const offerPercent = toIntOrNull(editOfferPercent);
    const offerStartAt = toIsoOrNull(editOfferStartAt);
    const offerEndAt = toIsoOrNull(editOfferEndAt);

    setSaving(true);
    setError(null);
    setNotice(null);

    const res = await supabase
      .from("packages")
      .update({
        title,
        subtitle: editSubtitle.trim() || null,
        description: editDescription.trim() || null,
        badge: editBadge.trim() || null,
        price_egp: Number.isFinite(price as any) ? price : null,
        offer_active: Boolean(editOfferActive),
        offer_badge: editOfferBadge.trim() || null,
        offer_price_egp: Number.isFinite(offerPrice as any) ? offerPrice : null,
        offer_percent: typeof offerPercent === "number" && offerPercent > 0 && offerPercent <= 100 ? offerPercent : null,
        offer_start_at: offerStartAt,
        offer_end_at: offerEndAt,
        features: linesToFeatures(editFeatures),
        theme: editTheme,
        sort_order: Number.isFinite(sortOrder as any) ? sortOrder : 0,
        active: Boolean(editActive),
      })
      .eq("id", editingId);

    if (res.error) {
      setError(res.error.message);
      setSaving(false);
      return;
    }

    cancelEdit();
    await fetchPackages();
    setSaving(false);
    pushNotice("success", "تم حفظ التعديلات.");
  };

  const deletePackage = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    const res = await supabase.from("packages").delete().eq("id", id);

    if (res.error) {
      setError(res.error.message);
      setSaving(false);
      return;
    }

    if (editingId === id) cancelEdit();
    if (selectedPackageId === id) {
      setSelectedPackageId("");
      setPackageCourses([]);
      setSelectedCourseId("");
      setAgeGroups([]);
      setAllowedAgeGroupIds(new Set());
    }

    setConfirmDeletePackageId(null);
    await fetchPackages();
    setSaving(false);
    pushNotice("success", "تم حذف الباقة.");
  };

  const addCourseToSelectedPackage = async (courseId: string) => {
    const pid = selectedPackageId.trim();
    if (!pid || !courseId) return;
    if (courseIdsInPackage.has(courseId)) return;
    if (pendingCourseAdds.has(courseId)) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const nextSort = Math.max(-1, ...packageCourses.map((x) => x.sort_order ?? 0)) + 1;

    setPendingCourseAdds((prev) => {
      const next = new Set(Array.from(prev));
      next.add(courseId);
      return next;
    });

    setSaving(true);
    setError(null);
    setNotice(null);

    const res = await supabase.from("package_courses").insert({
      package_id: pid,
      course_id: courseId,
      sort_order: nextSort,
    });

    if (res.error) {
      setError(res.error.message);
      setPendingCourseAdds((prev) => {
        const next = new Set(Array.from(prev));
        next.delete(courseId);
        return next;
      });
      setSaving(false);
      return;
    }

    setConfirmRemoveCourseId(null);
    setPendingCourseAdds((prev) => {
      const next = new Set(Array.from(prev));
      next.delete(courseId);
      return next;
    });
    await refreshPackageCourses(pid);
    setSaving(false);
    pushNotice("success", "تم تحديث كورسات الباقة.");
  };

  const removeCourseFromSelectedPackage = async (courseId: string) => {
    const pid = selectedPackageId.trim();
    if (!pid) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    const countRes = await supabase
      .from("package_courses")
      .select("package_id", { count: "exact", head: true })
      .eq("course_id", courseId);

    if (countRes.error) {
      setError(countRes.error.message);
      setSaving(false);
      return;
    }

    if ((countRes.count ?? 0) <= 1) {
      setError("لا يمكن إزالة الكورس من آخر باقة. لازم يكون الكورس مربوط بباقة واحدة على الأقل.");
      setConfirmRemoveCourseId(null);
      setSaving(false);
      return;
    }

    const delAges = await supabase
      .from("package_course_age_groups")
      .delete()
      .eq("package_id", pid)
      .eq("course_id", courseId);

    if (delAges.error) {
      setError(delAges.error.message);
      setSaving(false);
      return;
    }

    const res = await supabase
      .from("package_courses")
      .delete()
      .eq("package_id", pid)
      .eq("course_id", courseId);

    if (res.error) {
      setError(res.error.message);
      setSaving(false);
      return;
    }

    if (selectedCourseId === courseId) {
      setSelectedCourseId("");
      setAgeGroups([]);
      setAllowedAgeGroupIds(new Set());
    }

    setConfirmRemoveCourseId(null);
    await refreshPackageCourses(pid);
    setSaving(false);
    pushNotice("success", "تم تحديث كورسات الباقة.");
  };

  const toggleAllowedAgeGroup = async (ageGroupId: string, allow: boolean) => {
    const pid = selectedPackageId.trim();
    const cid = selectedCourseId.trim();
    if (!pid || !cid) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    if (allow) {
      const res = await supabase.from("package_course_age_groups").insert({
        package_id: pid,
        course_id: cid,
        age_group_id: ageGroupId,
      });

      if (res.error) {
        setError(res.error.message);
        setSaving(false);
        return;
      }

      setAllowedAgeGroupIds((prev) => {
        const next = new Set(Array.from(prev));
        next.add(ageGroupId);
        return next;
      });
    } else {
      const res = await supabase
        .from("package_course_age_groups")
        .delete()
        .eq("package_id", pid)
        .eq("course_id", cid)
        .eq("age_group_id", ageGroupId);

      if (res.error) {
        setError(res.error.message);
        setSaving(false);
        return;
      }

      setAllowedAgeGroupIds((prev) => {
        const next = new Set(Array.from(prev));
        next.delete(ageGroupId);
        return next;
      });
    }

    setSaving(false);
    pushNotice("success", "تم تحديث الأعمار المسموحة.");
  };

  const applyFeaturePresets = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    const smallFeatures = [
      "جدول تدريبي منظم يخليك تبدأ صح",
      "متابعة واتساب مرتين في الأسبوع عشان تفضل ماشي على الطريق",
      "قياسات شهرية تشوف بيها تطورك بعينك",
    ];

    const mediumFeatures = [
      "جدول تدريبي مخصص ليك وبيتغير مع تطورك",
      "نظام غذائي يخدم هدفك ويقربك للفورمة أسرع",
      "متابعة واتساب لتصحيح تكنيك التمرين ومنع أي أخطاء",
      "قياسات كل أسبوعين عشان نضغط على النتايج",
    ];

    const vipFeatures = [
      "برنامج تدريبي ذكي بيتغير حسب تطورك ونقاط ضعفك",
      "متابعة بالفيديو لتصحيح التكنيك خطوة بخطوة",
      "متابعة مستمرة على الشات لمراقبة الأداء واستخراج نقاط القوة والضعف",
      "نظام غذائي معمول ليك مخصوص عشان توصل لأقوى فورمة",
      "تدريبات متجددة طول الشهر… مفيش ملل ولا ثبات",
      "جلستين فيديو كول مع الكابتن شهريًا في أصعب أيام التمرين عشان تكون مش لوحدك",
    ];

    const [rSmall, rMedium, rVip] = await Promise.all([
      supabase.from("packages").update({ features: smallFeatures }).eq("slug", "small"),
      supabase.from("packages").update({ features: mediumFeatures }).eq("slug", "medium"),
      supabase.from("packages").update({ features: vipFeatures }).eq("slug", "vip"),
    ]);

    const firstError = rSmall.error || rMedium.error || rVip.error;
    if (firstError) {
      setError(firstError.message);
      setSaving(false);
      return;
    }

    setConfirmApplyFeaturePresets(false);
    await fetchPackages();
    setSaving(false);
    pushNotice("success", "تم تحديث مميزات الباقات.");
  };

  return (
    <div className="space-y-5" dir="rtl">
      <AdminCard>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-extrabold text-slate-900">الباقات</div>
              <div className="mt-1 text-sm text-slate-600">إضافة وتعديل وإدارة الباقات وربط الكورسات.</div>
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap">{loading ? "تحميل..." : `${packages.length} باقة`}</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {confirmApplyFeaturePresets ? (
              <>
                <button
                  type="button"
                  onClick={applyFeaturePresets}
                  disabled={saving}
                  className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
                >
                  تأكيد تعبئة المميزات
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmApplyFeaturePresets(false)}
                  disabled={saving}
                  className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
                >
                  إلغاء
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmApplyFeaturePresets(true)}
                disabled={saving}
                className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-200 disabled:opacity-50"
              >
                تعبئة مميزات الباقات
              </button>
            )}
            <button
              type="button"
              onClick={() => setCreateOpen((v) => !v)}
              disabled={saving}
              className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
            >
              {createOpen ? "إغلاق" : "إضافة باقة"}
            </button>
          </div>
        </div>

        <div
          className={
            "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs " +
            (error || notice?.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : loading || saving || notice?.kind === "info"
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : notice?.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600")
          }
        >
          {loading
            ? "تحميل..."
            : error
              ? error
              : saving
                ? "جاري الحفظ..."
                : notice
                  ? notice.text
                  : "بيانات مباشرة"}
        </div>

        {createOpen ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div>
              <div className="text-sm font-semibold text-slate-900">إضافة باقة</div>
              <div className="mt-1 text-sm text-slate-600">املأ البيانات الأساسية ثم احفظ.</div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">اسم الباقة</div>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Small / Medium / VIP"
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">Slug (اختياري)</div>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="small"
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">Subtitle</div>
                <input
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">Badge</div>
                <input
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="POPULAR"
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">السعر (EGP)</div>
                <input
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  inputMode="numeric"
                  placeholder="اختياري"
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">الترتيب</div>
                <input
                  value={newSort}
                  onChange={(e) => setNewSort(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">Theme</div>
                <select
                  value={newTheme}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "orange" || v === "blue" || v === "vip") setNewTheme(v);
                  }}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="orange">Orange</option>
                  <option value="blue">Blue</option>
                  <option value="vip">VIP</option>
                </select>
              </label>
            </div>

            <label className="mt-3 inline-flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
                className="h-4 w-4 accent-slate-700"
              />
              مفعّلة
            </label>

            <label className="mt-3 block">
              <div className="mb-2 text-right text-xs font-medium text-slate-600">وصف</div>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="mt-3 block">
              <div className="mb-2 text-right text-xs font-medium text-slate-600">مميزات (سطر لكل ميزة)</div>
              <textarea
                value={newFeatures}
                onChange={(e) => setNewFeatures(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">العروض (اختياري)</div>
              <div className="mt-2 text-xs text-slate-600">
                لو العرض مفعّل ومعاه وقت بداية/نهاية، هيتعرض تلقائياً في صفحة الباقات.
              </div>

              <label className="mt-3 inline-flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={newOfferActive}
                  onChange={(e) => setNewOfferActive(e.target.checked)}
                  className="h-4 w-4 accent-slate-700"
                />
                تفعيل العرض
              </label>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="block">
                  <div className="mb-2 text-right text-xs font-medium text-slate-600">Badge للعرض</div>
                  <input
                    value={newOfferBadge}
                    onChange={(e) => setNewOfferBadge(e.target.value)}
                    placeholder="SALE"
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-right text-xs font-medium text-slate-600">سعر العرض (EGP)</div>
                  <input
                    value={newOfferPrice}
                    onChange={(e) => setNewOfferPrice(e.target.value)}
                    inputMode="numeric"
                    placeholder="اختياري"
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="block">
                  <div className="mb-2 text-right text-xs font-medium text-slate-600">خصم %</div>
                  <input
                    value={newOfferPercent}
                    onChange={(e) => setNewOfferPercent(e.target.value)}
                    inputMode="numeric"
                    placeholder="مثال: 20"
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-right text-xs font-medium text-slate-600">بداية العرض</div>
                  <input
                    type="datetime-local"
                    value={newOfferStartAt}
                    onChange={(e) => setNewOfferStartAt(e.target.value)}
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-right text-xs font-medium text-slate-600">نهاية العرض</div>
                  <input
                    type="datetime-local"
                    value={newOfferEndAt}
                    onChange={(e) => setNewOfferEndAt(e.target.value)}
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={createPackage}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={() => {
                  resetCreate();
                  setCreateOpen(false);
                }}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : null}
      </AdminCard>

      <AdminCard>
        <div className="flex items-start justify-between gap-3">
          <div className="text-base font-extrabold text-slate-900">قائمة الباقات</div>
          <div className="text-xs text-slate-500 whitespace-nowrap">{sorted.length} باقة</div>
        </div>

        <div className="mt-4 space-y-3">
          {sorted.map((p) => {
            const isEditing = editingId === p.id;

            return (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_12px_40px_-28px_rgba(2,6,23,0.45)] backdrop-blur">
                {!isEditing ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={`/admin/packages/${encodeURIComponent(p.slug)}`} className="block">
                      <div className="text-base font-semibold text-slate-900">{p.title}</div>
                      <div className="mt-1 text-xs text-slate-500" dir="ltr">
                        {p.slug}
                      </div>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/packages/${encodeURIComponent(p.slug)}`}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                      >
                        فتح
                      </Link>

                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium border " +
                          (p.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200")
                        }
                      >
                        {p.active ? "نشطة" : "مقفولة"}
                      </span>

                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        disabled={saving || confirmDeletePackageId === p.id}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-200 disabled:opacity-50"
                      >
                        تعديل
                      </button>

                      {confirmDeletePackageId === p.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void deletePackage(p.id)}
                            disabled={saving}
                            className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-rose-700 disabled:opacity-50"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePackageId(null)}
                            disabled={saving}
                            className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
                          >
                            إلغاء
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePackageId(p.id)}
                          disabled={saving}
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-rose-700 border border-rose-200 shadow-sm transition enabled:hover:bg-rose-50 disabled:opacity-50"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <div className="mb-2 text-right text-xs font-medium text-slate-600">اسم الباقة</div>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        />
                      </label>

                      <label className="block">
                        <div className="mb-2 text-right text-xs font-medium text-slate-600">Subtitle</div>
                        <input
                          value={editSubtitle}
                          onChange={(e) => setEditSubtitle(e.target.value)}
                          className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <div className="mb-2 text-right text-xs font-medium text-slate-600">Badge</div>
                        <input
                          value={editBadge}
                          onChange={(e) => setEditBadge(e.target.value)}
                          className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        />
                      </label>

                      <label className="block">
                        <div className="mb-2 text-right text-xs font-medium text-slate-600">السعر (EGP)</div>
                        <input
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          inputMode="numeric"
                          className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="block">
                        <div className="mb-2 text-right text-xs font-medium text-slate-600">Theme</div>
                        <select
                          value={editTheme}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "orange" || v === "blue" || v === "vip") setEditTheme(v);
                          }}
                          className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        >
                          <option value="orange">Orange</option>
                          <option value="blue">Blue</option>
                          <option value="vip">VIP</option>
                        </select>
                      </label>

                      <label className="block">
                        <div className="mb-2 text-right text-xs font-medium text-slate-600">الترتيب</div>
                        <input
                          value={editSort}
                          onChange={(e) => setEditSort(e.target.value)}
                          inputMode="numeric"
                          className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        />
                      </label>

                      <label className="mt-7 inline-flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={(e) => setEditActive(e.target.checked)}
                          className="h-4 w-4 accent-slate-700"
                        />
                        مفعّلة
                      </label>
                    </div>

                    <label className="block">
                      <div className="mb-2 text-right text-xs font-medium text-slate-600">وصف</div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-2 text-right text-xs font-medium text-slate-600">مميزات (سطر لكل ميزة)</div>
                      <textarea
                        value={editFeatures}
                        onChange={(e) => setEditFeatures(e.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">العروض (اختياري)</div>
                      <label className="mt-3 inline-flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={editOfferActive}
                          onChange={(e) => setEditOfferActive(e.target.checked)}
                          className="h-4 w-4 accent-slate-700"
                        />
                        تفعيل العرض
                      </label>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <label className="block">
                          <div className="mb-2 text-right text-xs font-medium text-slate-600">Badge للعرض</div>
                          <input
                            value={editOfferBadge}
                            onChange={(e) => setEditOfferBadge(e.target.value)}
                            placeholder="SALE"
                            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-2 text-right text-xs font-medium text-slate-600">سعر العرض (EGP)</div>
                          <input
                            value={editOfferPrice}
                            onChange={(e) => setEditOfferPrice(e.target.value)}
                            inputMode="numeric"
                            placeholder="اختياري"
                            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <label className="block">
                          <div className="mb-2 text-right text-xs font-medium text-slate-600">خصم %</div>
                          <input
                            value={editOfferPercent}
                            onChange={(e) => setEditOfferPercent(e.target.value)}
                            inputMode="numeric"
                            placeholder="مثال: 20"
                            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-2 text-right text-xs font-medium text-slate-600">بداية العرض</div>
                          <input
                            type="datetime-local"
                            value={editOfferStartAt}
                            onChange={(e) => setEditOfferStartAt(e.target.value)}
                            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-2 text-right text-xs font-medium text-slate-600">نهاية العرض</div>
                          <input
                            type="datetime-local"
                            value={editOfferEndAt}
                            onChange={(e) => setEditOfferEndAt(e.target.value)}
                            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
                      >
                        حفظ
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!loading && sorted.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">
              لا توجد باقات.
            </div>
          ) : null}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="text-base font-extrabold text-slate-900">ربط الباقة بالكورسات</div>
        <div className="mt-2 text-sm text-slate-600">اختار باقة، واربطها بالكورسات، وبعدها حدد الأعمار (اختياري).</div>

        <div className="mt-5 grid gap-3 md:grid-cols-[260px_1fr]">
          <label className="block">
            <div className="mb-2 text-right text-xs font-medium text-slate-600">اختر الباقة</div>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">اختر…</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_12px_40px_-28px_rgba(2,6,23,0.45)] backdrop-blur">
            {!selectedPackage ? (
              <div className="text-sm text-slate-600">اختار باقة علشان تظهر الكورسات.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">كورسات الباقة</div>
                    <div className="mt-1 text-xs text-slate-500" dir="ltr">
                      {selectedPackage.slug}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">{courseIdsInPackage.size} كورس</div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_240px]">
                  <input
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                    placeholder="بحث عن كورس..."
                    className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                  <div className="flex items-center justify-end text-xs text-slate-500">
                    علّم/الغِ تعليم الكورس داخل هذه الباقة
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {filteredCourses.map((c) => {
                    const inPkg = courseIdsInPackage.has(c.id);
                    const optimisticChecked = inPkg || pendingCourseAdds.has(c.id);
                    const selected = c.id === selectedCourseId;
                    const isConfirming = confirmRemoveCourseId === c.id;

                    return (
                      <div
                        key={c.id}
                        className={
                          "rounded-2xl border px-4 py-3 " +
                          (selected ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-white")
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (inPkg) setSelectedCourseId(c.id);
                            }}
                            disabled={!inPkg || saving || isConfirming}
                            className="min-w-0 text-right"
                          >
                            <div className="truncate text-sm font-semibold text-slate-900">{c.title_ar ?? c.title_en ?? c.slug}</div>
                            {c.title_en ? (
                              <div className="mt-1 truncate text-xs text-slate-500" dir="ltr">
                                {c.title_en}
                              </div>
                            ) : null}
                            <div className="mt-1 truncate text-xs text-slate-500" dir="ltr">
                              {c.slug}
                            </div>
                          </button>

                          {isConfirming ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void removeCourseFromSelectedPackage(c.id)}
                                disabled={saving}
                                className="inline-flex h-9 items-center justify-center rounded-2xl bg-rose-600 px-3 text-xs font-semibold text-white shadow-sm transition enabled:hover:bg-rose-700 disabled:opacity-50"
                              >
                                تأكيد
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveCourseId(null)}
                                disabled={saving}
                                className="inline-flex h-9 items-center justify-center rounded-2xl bg-white px-3 text-xs font-semibold text-slate-700 border border-slate-200 transition enabled:hover:bg-slate-50 disabled:opacity-50"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={optimisticChecked}
                              onChange={(e) => {
                                const next = e.target.checked;
                                if (next) {
                                  void addCourseToSelectedPackage(c.id);
                                  return;
                                }
                                if (inPkg) setConfirmRemoveCourseId(c.id);
                              }}
                              disabled={saving || pendingCourseAdds.has(c.id)}
                              className="mt-1 h-4 w-4 accent-slate-700"
                            />
                          )}
                        </div>

                        {isConfirming ? (
                          <div className="mt-2 text-xs text-rose-700">سيتم حذف إعدادات الأعمار الخاصة بهذا الكورس داخل الباقة.</div>
                        ) : null}
                      </div>
                    );
                  })}

                  {filteredCourses.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200 md:col-span-2">
                      لا توجد نتائج.
                    </div>
                  ) : null}
                </div>

                {selectedCourseId ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">الأعمار داخل الكورس</div>
                      <div className="text-xs text-slate-500">{ageGroups.length} عمر</div>
                    </div>

                    <div className="mt-2 text-xs text-slate-600">
                      إذا لم تحدد أي عمر هنا، سيتم اعتبار أن كل الأعمار متاحة.
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {ageGroups.map((ag) => {
                        const checked = allowedAgeGroupIds.has(ag.id);
                        return (
                          <label
                            key={ag.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                          >
                            <div className="text-right">
                              <div className="text-sm text-slate-900">{ag.title ?? "عمر"}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                {(typeof ag.min_age === "number" ? ag.min_age : "?") +
                                  " - " +
                                  (typeof ag.max_age === "number" ? ag.max_age : "?")}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleAllowedAgeGroup(ag.id, e.target.checked)}
                              disabled={saving}
                              className="h-4 w-4 accent-slate-700"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
