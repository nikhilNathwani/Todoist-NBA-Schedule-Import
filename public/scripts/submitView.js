// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//           IMPORT STATUS UI                //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

const minDurationLoadingUI = 3000;
const importStatus = {
	LOADING: 0,
	SUCCESS: 1,
	ERROR: 2,
};
let showingLoadingUI = true;

async function waitForLoadingUI() {
	while (showingLoadingUI) {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
}

function showImportStatusUI(status, projectID = null, errorMessage = null) {
	const arrow = document.getElementById("arrow");
	arrow.innerHTML = getStatusArrow(status);

	const statusTitle = document.querySelector("h1");
	statusTitle.textContent = getStatusMessage(status);

	const subtitle = document.querySelector("h3");
	subtitle.textContent = getStatusSubtitle(status);

	if (status == importStatus.LOADING) {
		//Fade out form
		const form = document.querySelector("form");
		form.classList.add("fade-out");
		form.addEventListener("transitionend", (event) => {
			if (event.propertyName === "opacity") {
				form.remove();
				//Then grow logo banner and show Loading status
				growLogoBanner();
				const statusContainer = document.querySelector(".app-status");
				statusContainer.classList.add("fade-in");
				setTimeout(() => {
					showingLoadingUI = false;
				}, minDurationLoadingUI);
			}
		});
	} else {
		showNextStepsList(status, projectID, errorMessage);
		document.body.classList.remove("no-footer");
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//       IMPORT STATUS STRINGS               //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

function getStatusMessage(status) {
	switch (status) {
		case importStatus.LOADING:
			return "Importing schedule";
		case importStatus.SUCCESS:
			return "Import complete!";
		case importStatus.ERROR:
			return "An error occurred";
		default:
			return "An error occurred";
	}
}

function getStatusSubtitle(status) {
	switch (status) {
		case importStatus.LOADING:
			return "Please keep this window open";
		case importStatus.SUCCESS:
			return "Schedule added to Todoist";
		case importStatus.ERROR:
			return "";
		default:
			return "Unknown error";
	}
}

function getStatusArrow(status) {
	switch (status) {
		case importStatus.LOADING:
			return `<i class="fa-solid fa-arrow-rotate-right spinner" aria-hidden="true"></i>`;
		case importStatus.SUCCESS:
			return `<i class="fa-solid fa-check" aria-hidden="true"></i>`;
		case importStatus.ERROR:
			return `<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>`;
		default:
			return `<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//         NEXT STEP LINKS UI                //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
function showNextStepsList(status, projectID, errorMessage) {
	const nextSteps = makeNextStepsList(status, projectID, errorMessage);
	const appContent = document.querySelector(".app-content");
	appContent.appendChild(nextSteps);
	setTimeout(() => {
		nextSteps.classList.add("fade-in");
	}, 1200);
}

function makeNextStepsList(status, projectID, errorMessage) {
	const list = document.createElement("ul");
	list.classList.add("next-steps-list");
	// list.classList.add("fade-in");

	var listItems = [];

	if (status == importStatus.SUCCESS) {
		listItems = [
			{
				icon: `<i class="fa-solid fa-up-right-from-square"></i>`,
				linkName: "Open Todoist",
				desc: "to view schedule",
				link: `todoist://project?id=${projectID}`,
			},
			{
				icon: `<i class="fa-solid fa-arrow-left"></i>`,
				linkName: "Import another",
				desc: "schedule",
				link: `https://nba-todoist-import.vercel.app/configure-import?isInboxDefault=${isInboxDefault()}`,
			},
			{
				icon: `<i class="fa-regular fa-envelope"></i>`,
				linkName: "Contact me",
				desc: "",
				link: "mailto:nnathwani36@gmail.com?subject=Regarding%20NBA%20Todoist%20Import",
			},
		];
	}

	if (status == importStatus.ERROR) {
		listItems = [
			{
				icon: `<i class="fa-regular fa-envelope"></i>`,
				linkName: "Send error report",
				desc: "",
				link: `mailto:nnathwani36@gmail.com?subject=Issue%20with%20NBA%20Todoist%20Import&body=${encodeURIComponent(
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
