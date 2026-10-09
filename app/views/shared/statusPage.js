import { makeHead, makeFooter, makeLogoBanner } from "./components.js";
import { escapeHTML } from "./escapeHTML.js";

// One layout for every "here's what happened" page: the import result
// (success or failure), errors loading a page, and the 404. Logos with a
// status icon between them, a title, a message, then a list of links.
//
// links: [{ href, label, icon, after?, newTab? }]
//   icon: a Font Awesome class, e.g. "fa-solid fa-arrow-left"
//   after: plain text after the link ("to view schedule")
// teamID: show this team's logo instead of the NBA logo
// demoBanner: load the demo banner script (pages that honor demo parameters)
function makeStatusPageHTML({
	pageTitle,
	icon,
	title,
	message,
	links,
	teamID,
	demoBanner = false,
}) {
	const linkItems = links
		.map(
			({ href, label, icon: linkIcon, after, newTab }) => `
			<li>
				<a class="project project-game" href="${escapeHTML(href)}"${newTab ? ' target="_blank"' : ""}>
					<i class="${escapeHTML(linkIcon)}"></i> ${escapeHTML(label)}
				</a>${after ? ` ${escapeHTML(after)}` : ""}
			</li>`,
		)
		.join("");

	return `
	<!DOCTYPE html>
	<html lang="en">
		${makeHead(`NBA Schedule Import — ${pageTitle}`)}
		<body>
			<main>
				<div class="app-frame">
					<div class="app-header">
						${makeLogoBanner(true, { teamID, arrowIcon: STATUS_ICONS[icon] })}
						<div class="app-status fade-in">
							<h1>${escapeHTML(title)}</h1>
							<h3>${escapeHTML(message)}</h3>
						</div>
					</div>
					<div class="app-content">
						<ul>${linkItems}
						</ul>
					</div>
				</div>
			</main>
			${makeFooter()}
			${demoBanner ? '<script type="module" src="/scripts/ui/demoBanner.js"></script>' : ""}
		</body>
	</html>
	`;
}

const STATUS_ICONS = {
	success: '<i class="fa-solid fa-check" aria-hidden="true"></i>',
	error: '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>',
};

export { makeStatusPageHTML };
