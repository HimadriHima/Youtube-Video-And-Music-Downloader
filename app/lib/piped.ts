import type { IncomingHttpHeaders } from 'http';

export type PipedStream = {
  url: string;
  format?: string; // e.g., "MPEG_4", "WEBM", "M4A"
  mimeType?: string; // e.g., "video/mp4; codecs=\"avc1.64001F\""
  quality?: string; // e.g., "720p", "128 kbps"
  bitrate?: number;
  fps?: number;
  itag?: number;
  videoOnly?: boolean;
};

export type PipedStreamsResponse = {
  title?: string;
  duration?: number; // seconds
  thumbnailUrl?: string;
  livestream?: boolean;
  hls?: string | null;
  dash?: string | null;
  muxedStreams?: PipedStream[];
  videoStreams?: PipedStream[];
  audioStreams?: PipedStream[];
};

export const DEFAULT_PIPED_INSTANCE = process.env.PIPED_INSTANCE || 'https://piped.video';

export function isMp4Mime(mime?: string | null): boolean {
  if (!mime) return false;
  return /mp4/i.test(mime);
}

export function isMp4Format(format?: string | null): boolean {
  if (!format) return false;
  return /m4a|mpeg_4|mp4/i.test(format);
}

export async function fetchPipedStreams(videoId: string, instance = DEFAULT_PIPED_INSTANCE, extraHeaders?: IncomingHttpHeaders): Promise<PipedStreamsResponse> {
  const u = `${instance.replace(/\/$/, '')}/api/v1/streams/${encodeURIComponent(videoId)}`;
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  };
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (typeof v === 'string') headers[k] = v;
    }
  }
  const res = await fetch(u, { headers });
  if (!res.ok) throw new Error(`Piped request failed: ${res.status}`);
  const json = (await res.json()) as PipedStreamsResponse;
  return json;
}

export function selectBestMuxedMp4(data: PipedStreamsResponse): PipedStream | undefined {
  const muxed = (data.muxedStreams || []).filter(s => isMp4Mime(s.mimeType) || isMp4Format(s.format));
  if (muxed.length === 0) return undefined;
  // Prefer higher resolution/bitrate by sorting descending by bitrate, then by parsed height if available in quality
  const scored = muxed
    .map(s => ({ s, score: (s.bitrate || 0) + extractHeightScore(s.quality) }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.s;
}

export function selectBestMp4Pair(data: PipedStreamsResponse): { video: PipedStream; audio: PipedStream } | undefined {
  const videos = (data.videoStreams || []).filter(s => (s.videoOnly ?? true) && (isMp4Mime(s.mimeType) || isMp4Format(s.format)));
  const audios = (data.audioStreams || []).filter(s => isMp4Mime(s.mimeType) || isMp4Format(s.format));
  if (videos.length === 0 || audios.length === 0) return undefined;
  const bestVideo = videos
    .map(s => ({ s, score: (s.bitrate || 0) + extractHeightScore(s.quality) }))
    .sort((a, b) => b.score - a.score)[0].s;
  const bestAudio = audios
    .map(s => ({ s, score: (s.bitrate || 0) }))
    .sort((a, b) => b.score - a.score)[0].s;
  return { video: bestVideo, audio: bestAudio };
}

function extractHeightScore(quality?: string): number {
  if (!quality) return 0;
  const m = quality.match(/(\d{3,4})p/i);
  return m ? parseInt(m[1], 10) * 100 : 0;
}


