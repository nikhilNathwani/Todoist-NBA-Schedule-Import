const form = document.querySelector("form");
const teamSelect = form.elements["team"];
const projectSelect = form.elements["project"];
const minLoadingSpinnerTime = 2000; //2s

teamSelect.addEventListener("change", function () {
	enableSubmitButton();
	updateTeamSpecificUI(teamSelect.value);
});

form.addEventListener("submit", function (event) {
	event.preventDefault(); // Prevent the form from submitting in the traditional way
	showImportStatusUI(importStatus.LOADING);
	startImport(teamSelect.value, projectSelect.value);
});

function startImport(team, project) {
	fetch("/api/import-games", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ team, project }), // Send team and project values in the request body
	})
		.then((response) =>
			response.json().then((data) => {
				if (!response.ok) {
					throw new Error(
						data.message || "Failed to import schedule."
					);
				}
				return data;
			})
		)
		.then(async (data) => {
			while (showingLoadingUI) {
				// Wait for a small amount of time before checking again
				await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
			}
			console.log("Import complete");
			showImportStatusUI(importStatus.SUCCESS, data.projectID);
		})
		.catch(async (error) => {
			while (showingLoadingUI) {
				// Wait for a small amount of time before checking again
				await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
			}
			console.error("Import failed:", error);
			showImportStatusUI(importStatus.ERROR, null, error);
		});
}
