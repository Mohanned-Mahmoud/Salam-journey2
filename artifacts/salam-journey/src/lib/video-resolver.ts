import { resolveMediaUrl } from "./api";

export interface ResolvedVideo {
  type: "youtube" | "vimeo" | "drive" | "loom" | "direct" | "unknown";
  embedUrl?: string;
  directUrl?: string;
  isEmbed: boolean;
}

export function resolveVideoSource(rawUrl?: string | null): ResolvedVideo {
  if (!rawUrl || !rawUrl.trim()) {
    return { type: "unknown", isEmbed: false };
  }

  const url = rawUrl.trim();

  // 1. YouTube
  // Handles:
  // - https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // - https://youtu.be/dQw4w9WgXcQ
  // - https://www.youtube.com/embed/dQw4w9WgXcQ
  // - https://www.youtube.com/shorts/dQw4w9WgXcQ
  const ytMatch =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`,
      isEmbed: true,
    };
  }

  // 2. Vimeo
  // Handles:
  // - https://vimeo.com/123456789
  // - https://player.vimeo.com/video/123456789
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
      isEmbed: true,
    };
  }

  // 3. Google Drive
  // Handles:
  // - https://drive.google.com/file/d/FILE_ID/view...
  // - https://drive.google.com/open?id=FILE_ID
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+))/i);
  if (driveMatch) {
    const fileId = driveMatch[1] || driveMatch[2];
    return {
      type: "drive",
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      isEmbed: true,
    };
  }

  // 4. Loom
  // Handles:
  // - https://www.loom.com/share/VIDEO_ID
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i);
  if (loomMatch && loomMatch[1]) {
    const videoId = loomMatch[1];
    return {
      type: "loom",
      embedUrl: `https://www.loom.com/embed/${videoId}`,
      isEmbed: true,
    };
  }

  // 5. Direct MP4, WebM, or Cloudflare R2 / S3 file
  const isDirectVideo =
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".ogg") ||
    url.endsWith(".mov") ||
    url.endsWith(".m4v") ||
    url.startsWith("courses/") ||
    url.includes("/storage/");

  if (isDirectVideo) {
    return {
      type: "direct",
      directUrl: resolveMediaUrl(url),
      isEmbed: false,
    };
  }

  // Generic fallback: if it's already an http link, treat as direct or embed
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return {
      type: "direct",
      directUrl: url,
      isEmbed: false,
    };
  }

  // Key stored in R2
  return {
    type: "direct",
    directUrl: resolveMediaUrl(url),
    isEmbed: false,
  };
}
