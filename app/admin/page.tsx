'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
	const [hasCookie, setHasCookie] = useState<boolean>(false);
	const [lastUpdated, setLastUpdated] = useState<string>('');
	const [cookieHeader, setCookieHeader] = useState<string>('');
	const [cookiesTxt, setCookiesTxt] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [message, setMessage] = useState<string>('');
	const [authenticated, setAuthenticated] = useState<boolean>(false);
	const [password, setPassword] = useState<string>('');
	const [isVercel, setIsVercel] = useState<boolean>(false);

	async function refreshStatus() {
		try {
			const me = await fetch('/api/admin/me');
			const meData = await me.json();
			setAuthenticated(Boolean(meData?.authenticated));
		} catch {}
		try {
			const res = await fetch('/api/admin/cookie');
			const data = await res.json();
			setHasCookie(Boolean(data?.hasCookie));
			if (data?.lastUpdatedMs) {
				const d = new Date(data.lastUpdatedMs);
				setLastUpdated(d.toLocaleString());
			} else {
				setLastUpdated('');
			}
		} catch (e) {}
	}

	useEffect(() => {
		refreshStatus();
		// Check if we're on Vercel
		setIsVercel(window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.com'));
	}, []);

	async function submitJSON(body: any) {
		setLoading(true);
		setMessage('');
		try {
			const res = await fetch('/api/admin/cookie', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error(await res.text());
			setMessage('Saved');
			setCookieHeader('');
			setCookiesTxt('');
			await refreshStatus();
		} catch (err: any) {
			setMessage(err?.message || 'Failed');
		} finally {
			setLoading(false);
		}
	}

	async function handlePasteHeader() {
		if (!cookieHeader.trim()) return;
		await submitJSON({ cookieHeader });
	}

	async function handlePasteCookiesTxt() {
		if (!cookiesTxt.trim()) return;
		await submitJSON({ cookiesTxt });
	}

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setLoading(true);
		setMessage('');
		try {
			const text = await file.text();
			const res = await fetch('/api/admin/cookie', {
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				body: text
			});
			if (!res.ok) throw new Error(await res.text());
			setMessage('Uploaded');
			await refreshStatus();
		} catch (err: any) {
			setMessage(err?.message || 'Failed');
		} finally {
			setLoading(false);
			e.currentTarget.value = '';
		}
	}

	async function handleDelete() {
		setLoading(true);
		setMessage('');
		try {
			const res = await fetch('/api/admin/cookie', { method: 'DELETE' });
			if (!res.ok) throw new Error(await res.text());
			setMessage('Deleted');
			await refreshStatus();
		} catch (err: any) {
			setMessage(err?.message || 'Failed');
		} finally {
			setLoading(false);
		}
	}

	function Login() {
		return (
			<div style={{ maxWidth: 400, margin: '40px auto', padding: 16 }}>
				<h2>Admin Login</h2>
				<p>Enter admin password to continue.</p>
				<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', marginBottom: 8 }} />
				<button disabled={!password.trim() || loading} onClick={async () => {
					setLoading(true); setMessage('');
					try {
						const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
						if (!res.ok) throw new Error(await res.text());
						setPassword('');
						await refreshStatus();
					} catch (err: any) {
						setMessage(err?.message || 'Login failed');
					} finally { setLoading(false); }
				}}>Login</button>
				{message && <p>{message}</p>}
			</div>
		);
	}

	if (!authenticated) return <Login />;

	if (isVercel) {
		return (
			<div style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
				<h2>Admin: YouTube Cookie (Vercel)</h2>
				<p>Status: {hasCookie ? 'Cookie Saved' : 'No Cookie Saved'} {lastUpdated ? `(Updated: ${lastUpdated})` : ''}</p>
				{message && <p>{message}</p>}
				
				<div style={{ background: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 16 }}>
					<h3>⚠️ Vercel Deployment Notice</h3>
					<p>This app is running on Vercel, which doesn't support filesystem storage. To use YouTube cookies:</p>
					<ol>
						<li>Parse your cookies.txt or cookie header</li>
						<li>Go to your Vercel project dashboard</li>
						<li>Settings → Environment Variables</li>
						<li>Add: <code>YT_COOKIE_STORED</code> = <code>your-cookie-header-here</code></li>
						<li>Redeploy your app</li>
					</ol>
					<p><strong>Example:</strong> <code>YT_COOKIE_STORED=VISITOR_INFO1_LIVE=abc123; LOGIN_INFO=def456; SID=ghi789</code></p>
				</div>

				<div style={{ display: 'grid', gap: 16 }}>
					<div>
						<label>Paste Cookie Header (for reference):</label>
						<textarea value={cookieHeader} onChange={(e) => setCookieHeader(e.target.value)} rows={3} style={{ width: '100%' }} placeholder="Paste your cookie header here to copy to Vercel env var" />
						<button onClick={() => {
							if (cookieHeader.trim()) {
								navigator.clipboard.writeText(cookieHeader.trim());
								setMessage('Copied to clipboard! Add this as YT_COOKIE_STORED in Vercel env vars.');
							}
						}} disabled={!cookieHeader.trim()}>Copy for Vercel Env Var</button>
					</div>
					<div>
						<label>Paste cookies.txt (for reference):</label>
						<textarea value={cookiesTxt} onChange={(e) => setCookiesTxt(e.target.value)} rows={6} style={{ width: '100%' }} placeholder="Paste your cookies.txt here to parse and copy header" />
						<button onClick={() => {
							if (cookiesTxt.trim()) {
								// Simple parsing - in real app you'd use the server-side parser
								const lines = cookiesTxt.split('\n');
								const cookies: string[] = [];
								lines.forEach(line => {
									const parts = line.split('\t');
									if (parts.length >= 7) {
										const name = parts[5];
										const value = parts[6];
										if (name && value) cookies.push(`${name}=${value}`);
									}
								});
								const header = cookies.join('; ');
								if (header) {
									navigator.clipboard.writeText(header);
									setMessage('Parsed and copied to clipboard! Add this as YT_COOKIE_STORED in Vercel env vars.');
								} else {
									setMessage('Failed to parse cookies.txt');
								}
							}
						}} disabled={!cookiesTxt.trim()}>Parse & Copy for Vercel</button>
					</div>
					<div>
						<button onClick={async () => { setLoading(true); setMessage(''); try { const r = await fetch('/api/admin/logout', { method: 'POST' }); if (!r.ok) throw new Error(await r.text()); await refreshStatus(); } catch (e: any) { setMessage(e?.message || 'Failed'); } finally { setLoading(false); } }}>Logout</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
			<h2>Admin: YouTube Cookie</h2>
			<p>Status: {hasCookie ? 'Cookie Saved' : 'No Cookie Saved'} {lastUpdated ? `(Updated: ${lastUpdated})` : ''}</p>
			{message && <p>{message}</p>}
			<div style={{ display: 'grid', gap: 16 }}>
				<div>
					<label>Paste Cookie Header (single line):</label>
					<textarea value={cookieHeader} onChange={(e) => setCookieHeader(e.target.value)} rows={3} style={{ width: '100%' }} />
					<button onClick={handlePasteHeader} disabled={loading || !cookieHeader.trim()}>Save Header</button>
				</div>
				<div>
					<label>Paste cookies.txt (Netscape format):</label>
					<textarea value={cookiesTxt} onChange={(e) => setCookiesTxt(e.target.value)} rows={6} style={{ width: '100%' }} />
					<button onClick={handlePasteCookiesTxt} disabled={loading || !cookiesTxt.trim()}>Save cookies.txt</button>
				</div>
				<div>
					<label>Upload cookies.txt file:</label>
					<input type="file" accept=".txt" onChange={handleFileChange} />
				</div>
				<div>
					<button onClick={handleDelete} disabled={loading || !hasCookie}>Delete Saved Cookie</button>
				</div>
				<div>
					<button onClick={async () => { setLoading(true); setMessage(''); try { const r = await fetch('/api/admin/logout', { method: 'POST' }); if (!r.ok) throw new Error(await r.text()); await refreshStatus(); } catch (e: any) { setMessage(e?.message || 'Failed'); } finally { setLoading(false); } }}>Logout</button>
				</div>
			</div>
		</div>
	);
}


