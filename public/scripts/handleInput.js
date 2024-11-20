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
	fetch("/api/import-games", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ team, project }), // Send team and project values in the request body
	})
		.then((response) => {
			if (response.ok) {
				console.log("Import started successfully.");
				showImportStatusUI(importStatus.LOADING);
				pollStatus();
			} else {
				return response.json().then((data) => {
					console.error(
						"Error starting import in THEN-ELSE:",
						data.message
					);
					showImportStatusUI(importStatus.ERROR, null, data.message);
					// alert(`Failed to start import: ${data.message}`);
				});
			}
		})
		.catch((error) => {
			console.error("Error starting import in CATCH:", error);
			showImportStatusUI(importStatus.ERROR, null, error);
		});
}

// Function to check import status every 3 seconds
function pollStatus() {
	const intervalId = setInterval(() => {
		fetch("/api/import-status")
			.then((response) => {
				if (!response.ok)
					throw new Error("Failed to fetch import status.");
				return response.json();
			})
			.then((data) => {
				if (!data.importEnded) {
					console.log("Import in progress...");
					// document.getElementById("status-message").textContent =
					// 	"Status: Import in progress...";
				} else {
					// document.getElementById("status-message").textContent =
					// 	"Status: Import complete!";
					console.log("Import complete!");
					showImportStatusUI(importStatus.SUCCESS, data.projectID);
					clearInterval(intervalId); // Stop polling once import is complete
				}
			})
			.catch((error) => {
				console.error("Error checking status:", error);
				showImportStatusUI(importStatus.ERROR, null, error);
				clearInterval(intervalId); // Stop polling on error
			});
	}, 3000); // Poll every 3 seconds
}
