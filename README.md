# YouTube Downloader (Video + Music) – Next.js

Clean Next.js app to download YouTube videos as MP4 and audio as MP3.

## Features
- Clean, minimal UI
- Fetch video info (title, duration, thumbnail)
- Download MP4 (highest available mp4)
- Download MP3 (via ffmpeg)
- Simple cookie management via `/cookie/cookie.txt` file

## Prerequisites
- Node.js 18+
- ffmpeg is bundled via `ffmpeg-static`

## Setup
```bash
npm install
npm run dev
```
Open `http://localhost:3000` and paste a YouTube URL.

## YouTube Cookies Setup

To bypass "Sign in to confirm you're not a bot" messages:

1. **Create the cookie folder:**
   ```bash
   mkdir cookie
   ```

2. **Add your YouTube cookies:**
   - Place your `cookie.txt` file in the `/cookie` folder
   - The app will automatically read and use these cookies

3. **Getting YouTube cookies:**
   - **Chrome Extension:** Install "Get cookies.txt" extension
   - **Firefox Extension:** Install "cookies.txt" extension
   - **Manual:** Copy from browser dev tools Network tab

4. **Cookie format:**
   - Netscape format (standard cookies.txt format)
   - Or simple cookie header string

## Vercel Deployment

### Environment Variables
For Vercel deployment, set the cookie as an environment variable:

- `YT_COOKIE_STORED` = `VISITOR_INFO1_LIVE=abc123; LOGIN_INFO=def456; SID=ghi789`

### Getting YouTube Cookies for Vercel
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Visit youtube.com and sign in
4. Find any request to youtube.com
5. Copy the `Cookie` header value
6. Set as `YT_COOKIE_STORED` in Vercel environment variables

## Notes
- Streaming responses for large files
- For personal/educational use only. Respect YouTube ToS and copyright laws.
- Local development: cookies read from `/cookie/cookie.txt`
- Vercel deployment: cookies read from `YT_COOKIE_STORED` environment variable

### Troubleshooting
- If you see "Failed to fetch" or 500 on `/api/info`, add your YouTube cookies
- Some videos may be region or age restricted; cookies help in many cases
- Make sure your `cookie.txt` file is in the correct format

## Deploy
- **Vercel**: Recommended for easy deployment
- **Self-host**: Use Node.js platforms that support native modules and long-lived responses
- `ffmpeg-static` must be supported on your server platform/architecture
