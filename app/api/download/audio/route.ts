import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import sanitize from 'sanitize-filename';
import { getStoredCookieHeader } from '../../../../lib/cookieStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

if (ffmpegPath) {
	ffmpeg.setFfmpegPath(ffmpegPath);
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const url = searchParams.get('url') || '';
		if (!url || !ytdl.validateURL(url)) {
			return new Response('Invalid URL', { status: 400 });
		}

		const headers: Record<string, string> = {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
			'Accept-Language': 'en-US,en;q=0.9',
			'Referer': 'https://www.youtube.com/',
			'Origin': 'https://www.youtube.com'
		};
		const storedCookie = await getStoredCookieHeader();
		if (storedCookie) headers['Cookie'] = storedCookie;
		else if (process.env.YT_COOKIE) headers['Cookie'] = process.env.YT_COOKIE;
		const info = await ytdl.getInfo(url, { requestOptions: { headers } } as any);
		const title = sanitize(info.videoDetails.title || 'audio') || 'audio';

		const input = ytdl(url, { quality: 'highestaudio', filter: 'audioonly', requestOptions: { headers } } as any);

		const { readable, writable } = new TransformStream();
		const writer = writable.getWriter();

		// Pipe ffmpeg output into Web Stream
		const command = ffmpeg(input)
			.audioCodec('libmp3lame')
			.format('mp3')
			.on('error', (err) => {
				try { writer.abort(err); } catch {}
			})
			.on('end', () => {
				try { writer.close(); } catch {}
			});

		const passthrough = command.pipe();
		passthrough.on('data', (chunk: any) => writer.write(chunk));
		passthrough.on('end', () => {
			try { writer.close(); } catch {}
		});
		passthrough.on('error', (err: any) => {
			try { writer.abort(err); } catch {}
		});

		const responseHeaders = new Headers();
		responseHeaders.set('Content-Type', 'audio/mpeg');
		const asciiFallback = sanitize((title || 'audio').replace(/[^\x20-\x7E]/g, '')) || 'audio';
		const utf8Encoded = encodeURIComponent(`${title}.mp3`);
		responseHeaders.set('Content-Disposition', `attachment; filename="${asciiFallback}.mp3"; filename*=UTF-8''${utf8Encoded}`);

		return new Response(readable as any, { headers: responseHeaders });
	} catch (err: any) {
		return new Response(err?.message || 'Failed to download', { status: 500 });
	}
}


