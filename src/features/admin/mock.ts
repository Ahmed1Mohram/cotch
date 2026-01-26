export type VideoProvider = "youtube" | "gdrive";

export type Video = {
  id: string;
  title: string;
  description?: string;
  durationSeconds: number;
  provider: VideoProvider;
  embedUrl: string;
  sortOrder: number;
};

export type Day = {
  dayIndex: number;
  title?: string;
  videos: Video[];
};

export type Month = {
  id: string;
  title: string;
  monthIndex: number;
  daysCount: number;
  days: Day[];
};

export type PlayerCard = {
  id: string;
  label: string;
  age: number;
  heightCm: number;
  weightKg: number;
  lockedByDefault: boolean;
};

export type AgeGroup = {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  playerCards: PlayerCard[];
  months: Month[];
};

export type CourseTheme = "green" | "blue" | "orange";

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  theme: CourseTheme;
  ageGroups: AgeGroup[];
};

function makeVideo(partial: Partial<Video> & { id: string }): Video {
  return {
    id: partial.id,
    title: partial.title ?? "فيديو تدريب",
    description: partial.description ?? "شرح التمرين وخطوات التنفيذ.",
    durationSeconds: partial.durationSeconds ?? 540,
    provider: partial.provider ?? "youtube",
    embedUrl:
      partial.embedUrl ?? "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
    sortOrder: partial.sortOrder ?? 0,
  };
}

function makeMonth(params: {
  id: string;
  title: string;
  monthIndex: number;
  daysCount?: number;
}): Month {
  const daysCount = params.daysCount ?? 30;

  const days: Day[] = Array.from({ length: daysCount }).map((_, idx) => {
    const dayIndex = idx + 1;
    const hasVideos = dayIndex === 1 || dayIndex === 2 || dayIndex === 5;

    const videos = hasVideos
      ? [
          makeVideo({
            id: `${params.id}-d${dayIndex}-v1`,
            title: `تمرين اليوم ${dayIndex} (أساسيات)`,
            provider: "youtube",
            sortOrder: 0,
          }),
          makeVideo({
            id: `${params.id}-d${dayIndex}-v2`,
            title: `تمرين اليوم ${dayIndex} (متقدم)`,
            provider: "gdrive",
            embedUrl: "https://drive.google.com/file/d/FILE_ID/preview",
            sortOrder: 1,
          }),
        ]
      : [];

    return {
      dayIndex,
      title: dayIndex % 7 === 0 ? "اختبار" : "",
      videos,
    };
  });

  return {
    id: params.id,
    title: params.title,
    monthIndex: params.monthIndex,
    daysCount,
    days,
  };
}

function makeAgeGroup(params: {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
}): AgeGroup {
  return {
    id: params.id,
    name: params.name,
    minAge: params.minAge,
    maxAge: params.maxAge,
    playerCards: [
      {
        id: `${params.id}-pc1`,
        label: "نموذج لاعب 1",
        age: params.minAge,
        heightCm: 140,
        weightKg: 38,
        lockedByDefault: true,
      },
      {
        id: `${params.id}-pc2`,
        label: "نموذج لاعب 2",
        age: Math.min(params.maxAge, params.minAge + 2),
        heightCm: 155,
        weightKg: 48,
        lockedByDefault: true,
      },
      {
        id: `${params.id}-pc3`,
        label: "نموذج لاعب 3",
        age: params.maxAge,
        heightCm: 172,
        weightKg: 64,
        lockedByDefault: true,
      },
    ],
    months: [
      makeMonth({
        id: `${params.id}-m1`,
        title: "الشهر الأول",
        monthIndex: 1,
        daysCount: 30,
      }),
      makeMonth({
        id: `${params.id}-m2`,
        title: "الشهر الثاني",
        monthIndex: 2,
        daysCount: 30,
      }),
    ],
  };
}

export const adminCourses: Course[] = [
  {
    id: "course-football",
    slug: "football",
    title: "كرة القدم",
    description: "برنامج تطوير السرعة والتحمل والمهارات الفردية.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1400&q=80",
    theme: "green",
    ageGroups: [
      makeAgeGroup({ id: "football-ag1", name: "8–10", minAge: 8, maxAge: 10 }),
      makeAgeGroup({ id: "football-ag2", name: "11–13", minAge: 11, maxAge: 13 }),
    ],
  },
  {
    id: "course-gym",
    slug: "gym",
    title: "الجيم",
    description: "قوة + تضخيم + حرق دهون بخطة منظمة.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80",
    theme: "orange",
    ageGroups: [
      makeAgeGroup({ id: "gym-ag1", name: "16–20", minAge: 16, maxAge: 20 }),
      makeAgeGroup({ id: "gym-ag2", name: "21–30", minAge: 21, maxAge: 30 }),
    ],
  },
  {
    id: "course-swim",
    slug: "swimming",
    title: "السباحة",
    description: "تقنية + لياقة + تنفس + سرعة داخل الماء.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1530549387789-4c1017266636?auto=format&fit=crop&w=1400&q=80",
    theme: "blue",
    ageGroups: [
      makeAgeGroup({ id: "swim-ag1", name: "10–12", minAge: 10, maxAge: 12 }),
      makeAgeGroup({ id: "swim-ag2", name: "13–16", minAge: 13, maxAge: 16 }),
    ],
  },
];

export function getAdminCourseBySlug(slug: string): Course | undefined {
  const normalized = slug.trim().toLowerCase().replace(/\/+$/, "").replace(/\.html$/, "");
  return adminCourses.find((c) => c.slug === normalized);
}
