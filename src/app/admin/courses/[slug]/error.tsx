"use client";

export default function AdminCourseDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6" dir="rtl">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="font-heading text-xl tracking-[0.12em] text-slate-900">حدث خطأ في صفحة الكورس</div>
        <div className="mt-3 text-sm text-slate-700" dir="ltr">
          {error?.message ?? "Unknown error"}
        </div>
        {error?.digest ? (
          <div className="mt-2 text-xs text-slate-500" dir="ltr">
            digest: {error.digest}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="h-11 rounded-2xl bg-orange-600 px-5 text-xs font-heading tracking-[0.12em] text-white shadow-sm transition hover:bg-orange-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  );
}
