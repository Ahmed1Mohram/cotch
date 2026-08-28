import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id");

  if (!fileId || !/^[A-Za-z0-9_-]{10,}$/.test(fileId)) {
    return new NextResponse("Invalid file ID", { status: 400 });
  }

  // 1. Try to get direct stream URL from Google Drive
  const urlsToTry = [
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`,
    `https://docs.google.com/uc?export=download&id=${fileId}`,
  ];

  const rangeHeader = req.headers.get("range");

  for (const targetUrl of urlsToTry) {
    try {
      const headers: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      };
      if (rangeHeader) {
        headers["Range"] = rangeHeader;
      }

      const res = await fetch(targetUrl, {
        headers,
        redirect: "follow",
      });

      const contentType = res.headers.get("content-type") || "";

      // Ensure it's actually media content and not an HTML error/login page
      if (res.ok || res.status === 206) {
        if (!contentType.includes("html") && !contentType.includes("text/plain")) {
          const resHeaders = new Headers();
          resHeaders.set("Content-Type", contentType || "video/mp4");
          
          const contentLength = res.headers.get("content-length");
          if (contentLength) resHeaders.set("Content-Length", contentLength);

          const contentRange = res.headers.get("content-range");
          if (contentRange) resHeaders.set("Content-Range", contentRange);

          const acceptRanges = res.headers.get("accept-ranges") || "bytes";
          resHeaders.set("Accept-Ranges", acceptRanges);
          resHeaders.set("Cache-Control", "public, max-age=7200, s-maxage=7200");

          return new NextResponse(res.body as any, {
            status: res.status,
            headers: resHeaders,
          });
        }
      }
    } catch {
      // Continue to next URL fallback
    }
  }

  return new NextResponse("Unable to stream video", { status: 404 });
}
