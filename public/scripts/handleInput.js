const form = document.querySelector("form");
const teamSelect = form.elements["team"];
const projectSelect = form.elements["project"];

teamSelect.addEventListener("change", function () {
	enableSubmitButton();
	updateTeamSpecificUI(teamSelect.value);
});

form.addEventListener("submit", function (event) {
	event.preventDefault(); // Prevent the form from submitting in the traditional way
	fadeOutForm();
	startImport(teamSelect.value, projectSelect.value);
});

function startImport(team, project) {
	showImportStatusUI(importStatus.LOADING);
	fetch("/api/import-games", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ team, project }), // Send team and project values in the request body
	})
		.then((response) => {
			if (!response.ok) throw new Error("Failed to import schedule.");
			return response.json();
		})
		.then((data) => {
			console.log("Import complete");
			showImportStatusUI(importStatus.SUCCESS, data.projectID);
		})
		.catch((error) => {
			console.error("Import failed:", error);
			showImportStatusUI(importStatus.ERROR, null, error);
		});
}
