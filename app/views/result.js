import { makeStatusPageHTML } from "./shared/statusPage.js";

// The page an import ends on, success or failure. POST /setup saves the
// outcome in the session and redirects here (see routes/setup.js).
// result: { ok: true, deepLink } or { ok: false, message }
// teamID: the team that was imported, for the header logo (may be undefined)
function makeResultPageHTML(result, teamID) {
	if (result.ok) {
		return makeStatusPageHTML({
			pageTitle: "Import complete",
			icon: "success",
			title: "Import complete!",
			message: "Schedule added to Todoist",
			teamID,
			links: [
				{
					href: result.deepLink,
					label: "Open Todoist",
					icon: "fa-solid fa-up-right-from-square",
					after: "to view schedule",
					newTab: true,
				},
				{
					href: "/setup",
					label: "Import another",
					icon: "fa-solid fa-arrow-left",
					after: "schedule",
				},
				{
					href: contactLink("Regarding NBA Todoist Import"),
					label: "Contact me",
					icon: "fa-regular fa-envelope",
					newTab: true,
				},
			],
		});
	}

	return makeStatusPageHTML({
		pageTitle: "Import failed",
		icon: "error",
		title: "An error occurred",
		message: result.message,
		teamID,
		links: [
			{
				href: contactLink(
					"Issue with NBA Todoist Import",
					"I encountered the following error when trying to import an NBA schedule into Todoist:\n\n" +
						result.message,
				),
				label: "Send error report",
				icon: "fa-regular fa-envelope",
				newTab: true,
			},
			{ href: "/setup", label: "Try again", icon: "fa-solid fa-arrow-left" },
		],
	});
}

function contactLink(subject, body) {
	const query = `subject=${encodeURIComponent(subject)}${
		body ? `&body=${encodeURIComponent(body)}` : ""
	}`;
	return `mailto:nnathwani36@gmail.com?${query}`;
}

export { makeResultPageHTML };
