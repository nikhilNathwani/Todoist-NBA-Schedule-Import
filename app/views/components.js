function makeHead(title = "NBA -> Todoist Schedule Import") {
	return `
		<head>
			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>${title}</title>
			<meta property="og:type" content="website" />
			<meta property="og:url" content="https://nba-todoist-import.vercel.app/" />
			<meta property="og:title" content="NBA Schedule Import" />
			<meta property="og:description" content="Import your favorite NBA team's regular season schedule into Todoist as tasks." />
			<meta property="og:image" content="https://nba-todoist-import.vercel.app/og-image.png" />
			<meta property="og:image:width" content="1200" />
			<meta property="og:image:height" content="630" />
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:image" content="https://nba-todoist-import.vercel.app/og-image.png" />
			<link rel="stylesheet" href="/style.css" />
			<link
				rel="apple-touch-icon"
				sizes="180x180"
				href="/images/favicon/apple-touch-icon.png"
			/>
			<link
				rel="icon"
				type="image/png"
				sizes="32x32"
				href="/images/favicon/favicon-32x32.png"
			/>
			<link
				rel="icon"
				type="image/png"
				sizes="16x16"
				href="/images/favicon/favicon-16x16.png"
			/>
			<link rel="manifest" href="/images/favicon/site.webmanifest" />
			<script
				src="https://kit.fontawesome.com/caba6ce64c.js"
				crossorigin="anonymous"
			></script>
		</head>`;
}

function makeFooter() {
	return `
		<footer>
			<div>&copy; Nikhil Nathwani</div>
			|
			<a target="_blank" href="https://nikhilnathwani.com">Other Work</a>
			|
			<a
				target="_blank"
				href="https://github.com/nikhilNathwani/Todoist-NBA-Schedule-Saver"
				>Github</a
			>
		</footer>`;
}

function makeLogoBanner(isLarge = false) {
	const sizeClass = isLarge ? "logo-banner-large" : "";
	return `
		<div class="logo-banner ${sizeClass}">
			<div class="logo-container" id="nbaLogoContainer">
				<img src="/images/nba-logo.png" alt="NBA Logo" />
			</div>
			<div id="arrow">
				<i class="fa-solid fa-arrow-right"></i>
			</div>
			<div class="logo-container">
				<img
					src="/images/todoist-color-logo.png"
					alt="Todoist Brand Logo"
				/>
			</div>
		</div>`;
}

export { makeHead, makeFooter, makeLogoBanner };
