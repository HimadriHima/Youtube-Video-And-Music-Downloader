'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
	const [hasCookie, setHasCookie] = useState<boolean>(false);
	const [lastUpdated, setLastUpdated] = useState<string>('');
	const [cookieHeader, setCookieHeader] = useState<string>('');
	const [cookiesTxt, setCookiesTxt] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [message, setMessage] = useState<string>('');

	async function refreshStatus() {
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
			</div>
		</div>
	);
}


