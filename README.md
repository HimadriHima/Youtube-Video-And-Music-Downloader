# YouTube Downloader (Video + Music) – Next.js

Clean Next.js app to download YouTube videos as MP4 and audio as MP3.

## Features
- Clean, minimal UI
- Fetch video info (title, duration, thumbnail)
- Download MP4 (highest available mp4)
- Download MP3 (via ffmpeg)

You have to add cookie if you have this problem.
  <img width="1100" height="418" alt="image" src="https://github.com/user-attachments/assets/b01f08ab-6ab4-4c72-bc24-32c763b93908" />


## Prerequisites
- Node.js 18+
- ffmpeg is bundled via `ffmpeg-static`

## Setup
```bash
npm install
npm run dev
```
Open `http://localhost:3000` and paste a YouTube URL.

## Notes
- Streaming responses for large files
- For personal/educational use only. Respect YouTube ToS and copyright laws.

### Troubleshooting
- If you see "Failed to fetch" or 500 on `/api/info`, set `YT_COOKIE` in `.env.local` using your browser cookies for `youtube.com`. Then restart dev server.
- Some videos may be region or age restricted; cookies help in many cases.

## Deploy
- Self-host on Node.js platforms that support native modules and long-lived responses
- `ffmpeg-static` must be supported on your server platform/architecture
