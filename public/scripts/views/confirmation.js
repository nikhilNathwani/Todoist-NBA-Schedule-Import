/**
 * Next Steps List
 * Displays actionable next steps after import completes (success or error)
 */

const delayNextStepsFadeIn = 1200;

function showNextStepsList(status, deepLink, errorMessage) {
	const nextSteps = makeNextStepsList(status, deepLink, errorMessage);
	const appContent = document.querySelector(".app-content");
	appContent.appendChild(nextSteps);
	setTimeout(() => {
		nextSteps.classList.add("fade-in");
	}, delayNextStepsFadeIn);
}

function makeNextStepsList(status, deepLink, errorMessage) {
	const list = document.createElement("ul");
	list.classList.add("next-steps-list");

	var listItems = [];

	if (status == importStatus.SUCCESS) {
		listItems = [
			{
				icon: `<i class="fa-solid fa-up-right-from-square"></i>`,
				linkName: "Open Todoist",
				desc: "to view schedule",
				link: deepLink,
			},
			{
				icon: `<i class="fa-solid fa-arrow-left"></i>`,
				linkName: "Import another",
				desc: "schedule",
				link: `https://nba-todoist-import.vercel.app/configure-import`,
			},
			{
				icon: `<i class="fa-regular fa-envelope"></i>`,
				linkName: "Contact me",
				desc: "",
				link: `mailto:nnathwani36@gmail.com?subject=${encodeURIComponent(
					"Regarding NBA Todoist Import"
				)}`,
			},
		];
	}

	if (status == importStatus.ERROR) {
		listItems = [
			{
				icon: `<i class="fa-regular fa-envelope"></i>`,
				linkName: "Send error report",
				desc: "",
				link: `mailto:nnathwani36@gmail.com?subject=${encodeURIComponent(
					"Issue with NBA Todoist Import"
				)}&body=${encodeURIComponent(
					"I encountered the following error when trying to import an NBA schedule into Todoist:\n\n" +
						errorMessage
				)}`,
			},
			{
				icon: `<i class="fa-solid fa-arrow-left"></i>`,
				linkName: "Try again",
				desc: "",
				link: "https://nba-todoist-import.vercel.app/",
			},
		];
	}
	for (const listItem of listItems) {
		list.appendChild(
			makeListItem(
				listItem.icon,
				listItem.linkName,
				listItem.desc,
				listItem.link
			)
		);
	}
	return list;
}

function makeListItem(icon, linkName, desc, link) {
	const listItem = document.createElement("li");
	listItem.innerHTML = `
		<a
			class="project project-game"
			href="${link}"
			${icon == `<i class="fa-solid fa-arrow-left"></i>` ? `` : `target="_blank"`}
		>${icon} ${linkName}</a> ${desc}`;
	return listItem;
}
