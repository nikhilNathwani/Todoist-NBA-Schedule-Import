import type { Metadata } from "next";
import Script from "next/script";
import Footer from "@/components/Footer";

// Replaces the hand-built <meta> strings in app/views/components.js's
// makeHead() (now removed) with Next's typed `metadata` export. Per-page
// title overrides (e.g. /configure-import) are set via each page's own
// `metadata` export, which Next merges over these defaults.
export const metadata: Metadata = {
	title: "NBA -> Todoist Schedule Import",
	openGraph: {
		type: "website",
		url: "https://nba-todoist-import.vercel.app/",
		title: "NBA Schedule Import",
		description:
			"Import your favorite NBA team's regular season schedule into Todoist as tasks.",
		images: [
			{
				url: "https://nba-todoist-import.vercel.app/og-image.png",
				width: 1200,
				height: 630,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		images: ["https://nba-todoist-import.vercel.app/og-image.png"],
	},
	icons: {
		apple: "/images/favicon/apple-touch-icon.png",
		icon: [
			{ url: "/images/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/images/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
		],
	},
	manifest: "/images/favicon/site.webmanifest",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<head>
				<link rel="stylesheet" href="/style.css" />
			</head>
			<body>
				{children}
				<Footer />
				{/* Same FontAwesome kit script as the original app/views/components.js
				    makeHead(). Loaded with next/script's afterInteractive strategy
				    (non-blocking, loads once the page is interactive) since it's
				    only used for decorative icons, not critical content. */}
				<Script
					src="https://kit.fontawesome.com/caba6ce64c.js"
					crossOrigin="anonymous"
					strategy="afterInteractive"
				/>
			</body>
		</html>
	);
}
