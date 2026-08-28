"use client";

import { useMemo } from "react";
import { WatermarkOverlay } from "@/features/video/WatermarkOverlay";

export type ParsedVideoInfo = {
  type: "gdrive" | "youtube" | "html5" | "iframe" | "invalid";
  rawUrl: string;
  embedUrl: string;
  directStreamUrl?: string;
  driveFileId?: string;
  // externalUrl intentionally removed — prevents Drive link exposure
};

export function parseVideoUrl(inputUrl: string | null | undefined): ParsedVideoInfo {
  if (!inputUrl) {
    return { type: "invalid", rawUrl: "", embedUrl: "" };
  }

  let url = inputUrl.trim();
  if (!url) return { type: "invalid", rawUrl: "", embedUrl: "" };

  if (/^(drive\.google\.com|www\.|youtube\.com|youtu\.be)/i.test(url)) {
    url = `https://${url}`;
  }

  // 1. Check Google Drive URL formats
  const driveFileMatch =
    url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i) ||
    url.match(/drive\.google\.com\/open\?id=([^&#]+)/i) ||
    url.match(/drive\.google\.com\/uc\?(?:[^&#]+&)*id=([^&#]+)/i) ||
    url.match(/docs\.google\.com\/file\/d\/([^/?#]+)/i);

  if (driveFileMatch?.[1]) {
    const fileId = driveFileMatch[1];
    return {
      type: "gdrive",
      rawUrl: url,
      driveFileId: fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directStreamUrl: `/api/video-stream?id=${fileId}`,
    };
  }

  // Raw Google Drive ID alone (e.g. 1a2b3c4d...)
  if (!/^https?:\/\//i.test(url)) {
    const idOnlyMatch = url.match(/^([A-Za-z0-9_-]{15,})(?:[/?#].*)?$/);
    if (idOnlyMatch?.[1]) {
      const fileId = idOnlyMatch[1];
      return {
        type: "gdrive",
        rawUrl: url,
        driveFileId: fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        directStreamUrl: `/api/video-stream?id=${fileId}`,
      };
    }
  }

  // 2. Check YouTube URL formats
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );
  if (youtubeMatch?.[1]) {
    const videoId = youtubeMatch[1];
    return {
      type: "youtube",
      rawUrl: url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`,
    };
  }

  // 3. Check HTML5 Direct Video
  const lowerUrl = url.toLowerCase();
  if (
    lowerUrl.includes(".mp4") ||
    lowerUrl.includes(".webm") ||
    lowerUrl.includes(".ogg") ||
    lowerUrl.includes("googleusercontent.com")
  ) {
    return {
      type: "html5",
      rawUrl: url,
      embedUrl: url,
      directStreamUrl: url,
    };
  }

  // 4. General Iframe URL
  if (/^https?:\/\//i.test(url)) {
    return {
      type: "iframe",
      rawUrl: url,
      embedUrl: url,
    };
  }

  return { type: "invalid", rawUrl: url, embedUrl: "" };
}

export function UniversalVideoPlayer({
  videoUrl,
  title,
  watermark,
  className = "h-[340px] sm:h-[440px] w-full min-h-[340px]",
  showLogo = true,
}: {
  videoUrl: string | null | undefined;
  title?: string | null;
  watermark?: { name: string; phone: string } | null;
  className?: string;
  showLogo?: boolean;
}) {
  const parsed = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);

  if (parsed.type === "invalid" || !videoUrl) {
    return (
      <div className={`grid place-items-center bg-black/90 text-white/60 text-sm ${className}`} dir="rtl">
        رابط الفيديو غير صحيح أو غير متاح
      </div>
    );
  }

  const currentTitle = title || "فيديو";

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-3xl bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.10)]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={`relative ${className}`}>
        {parsed.type === "html5" || parsed.type === "gdrive" ? (
          <video
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            disablePictureInPicture
            className="h-full w-full bg-black object-contain"
            src={parsed.directStreamUrl || parsed.embedUrl}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : parsed.type === "youtube" ? (
          <iframe
            key={parsed.embedUrl}
            className="h-full w-full border-0"
            src={parsed.embedUrl}
            title={currentTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
            <iframe
              key={parsed.embedUrl}
              className="h-full w-full border-0"
              src={parsed.embedUrl}
              title={currentTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <div
              className="absolute inset-0 z-[1]"
              style={{ pointerEvents: "none" }}
              aria-hidden="true"
            />
          </>
        )}

        {watermark ? <WatermarkOverlay name={watermark.name} phone={watermark.phone} /> : null}

        {showLogo ? (
          <div className="pointer-events-none absolute right-2 top-2 z-10" dir="rtl">
            <div className="rounded-2xl bg-black/55 px-3 py-2 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
              <img src="/s.png" alt="logo" className="h-9 w-auto opacity-90" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

