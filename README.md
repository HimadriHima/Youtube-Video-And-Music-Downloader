# YouTube Downloader (Video + Music) – Next.js

Clean Next.js app to download YouTube videos as MP4 and audio as MP3.

## Features
- Clean, minimal UI
- Fetch video info (title, duration, thumbnail)
- Download MP4 (highest available mp4)
- Download MP3 (via ffmpeg)
- Admin panel for YouTube cookie management
- Password-protected admin interface

## Prerequisites
- Node.js 18+
- ffmpeg is bundled via `ffmpeg-static`

## Setup
```bash
npm install
npm run dev
```
Open `http://localhost:3000` and paste a YouTube URL.

## Admin Panel
Access the admin panel at `/admin` to manage YouTube cookies:

1. Set environment variables:
   ```bash
   # .env.local
   ADMIN_PASSWORD=your-strong-password
   ADMIN_SECRET=optional-long-random-string
   ```

2. Visit `/admin` and login with your password
3. Paste your YouTube cookies (from browser dev tools or cookies.txt)
4. Cookies will be stored locally and used for downloads

## Vercel Deployment

### Environment Variables
Set these in your Vercel project settings:

1. **Required:**
   - `ADMIN_PASSWORD` = `your-strong-password`

2. **Optional but recommended:**
   - `ADMIN_SECRET` = `long-random-string-for-session-security`

3. **For YouTube cookies (to bypass bot detection):**
   - `YT_COOKIE_STORED` = `VISITOR_INFO1_LIVE=abc123; LOGIN_INFO=def456; SID=ghi789`

### Getting YouTube Cookies
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Visit youtube.com and sign in
4. Find any request to youtube.com
5. Copy the `Cookie` header value
6. Set as `YT_COOKIE_STORED` in Vercel environment variables

### Admin Panel on Vercel
- Visit `https://your-app.vercel.app/admin`
- Login with your `ADMIN_PASSWORD`
- The admin panel will show Vercel-specific instructions
- Use the "Copy for Vercel Env Var" buttons to easily copy cookie headers
- Add the copied value as `YT_COOKIE_STORED` in Vercel settings
- Redeploy after adding environment variables

## Notes
- Streaming responses for large files
- For personal/educational use only. Respect YouTube ToS and copyright laws.
- On Vercel, cookies are stored in environment variables (not filesystem)
- Local development uses filesystem storage in OS app data directory

### Troubleshooting
- If you see "Failed to fetch" or 500 on `/api/info`, set `YT_COOKIE_STORED` in Vercel environment variables using your browser cookies for `youtube.com`.
- Some videos may be region or age restricted; cookies help in many cases.
- For local development, use `YT_COOKIE` in `.env.local` as a fallback.

## Deploy
- **Vercel**: Recommended for easy deployment
- **Self-host**: Use Node.js platforms that support native modules and long-lived responses
- `ffmpeg-static` must be supported on your server platform/architecture
