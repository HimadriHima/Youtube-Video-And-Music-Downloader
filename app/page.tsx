'use client';

import { useState } from 'react';

type InfoResponse = {
	title: string;
	durationSeconds: number;
	thumbnailUrl: string;
};

export default function HomePage() {
	const [url, setUrl] = useState('');
	const [info, setInfo] = useState<InfoResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function fetchInfo() {
		setError(null);
		setInfo(null);
		if (!url.trim()) return;
		setLoading(true);
		try {
			const res = await fetch('/api/info?url=' + encodeURIComponent(url));
			const text = await res.text();
			if (!res.ok) {
				let msg = 'Failed to fetch';
				try { const j = JSON.parse(text); msg = j.error || msg; } catch {}
				throw new Error(msg);
			}
			const data = JSON.parse(text);
			setInfo(data);
		} catch (e: any) {
			setError(e?.message || 'Something went wrong');
		} finally {
			setLoading(false);
		}
	}

	function download(path: string) {
		window.location.href = path + '?url=' + encodeURIComponent(url);
	}

	return (
		<div style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', padding: '24px' }}>
			<div style={{ width: '100%', maxWidth: 720 }}>
				<h1 style={{ margin: 0, fontSize: 32 }}>YouTube Downloader</h1>
				<p style={{ opacity: 0.7, marginTop: 8 }}>Clean, fast video and music downloads.</p>

				<div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
					<input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="Paste YouTube URL"
						style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #2a2f3a', background: '#0f1424', color: 'inherit' }}
					/>
					<button onClick={fetchInfo} disabled={loading || !url.trim()} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #2a2f3a', background: '#1b2236', color: 'inherit', cursor: 'pointer' }}>
						{loading ? 'Loading…' : 'Get Info'}
					</button>
				</div>

				{error && (
					<div style={{ marginTop: 12, color: '#ff6b6b' }}>{error}</div>
				)}

				{info && (
					<div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
						<img src={info.thumbnailUrl} alt="thumbnail" style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #2a2f3a' }} />
						<div style={{ flex: 1 }}>
							<div style={{ fontWeight: 600 }}>{info.title}</div>
							<div style={{ opacity: 0.7, marginTop: 4 }}>Duration: {Math.round(info.durationSeconds / 60)} min</div>
							<div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
								<button onClick={() => download('/api/download/video')} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2f3a', background: '#0f9d58', color: 'white', cursor: 'pointer' }}>Download MP4</button>
								<button onClick={() => download('/api/download/audio')} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2f3a', background: '#4285f4', color: 'white', cursor: 'pointer' }}>Download MP3</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}


