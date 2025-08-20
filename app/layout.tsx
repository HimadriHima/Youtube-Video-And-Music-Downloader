import type { ReactNode } from 'react';
export const metadata = {
	title: 'YouTube Downloader',
	description: 'Download YouTube videos and music cleanly'
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', background: '#0b0f19', color: '#e6e8ee', margin: 0 }}>
				{children}
			</body>
		</html>
	);
}


