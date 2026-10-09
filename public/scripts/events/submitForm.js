/**
 * Shows a loading screen while the form posts
 * The form submits normally (POST /setup): the server runs the import and
 * redirects to /result. That takes a few seconds, and until the result
 * arrives the browser keeps this page on screen, so swap the form for a
 * "please wait" header.
 */

import { growLogoBanner } from "../ui/header/teamLogo.js";

export function listenForFormSubmit(form) {
	let submitted = false;

	form.addEventListener("submit", function (event) {
		// Only the first submit counts. A double-click would otherwise post
		// twice: two imports, where the second sees the project the first
		// just created, fails the project-limit check, and its error page
		// replaces the real success.
		if (submitted) {
			event.preventDefault();
			return;
		}
		submitted = true;
		showLoadingScreen(form);
	});

	// Going Back from /result can restore this page from the browser's
	// back-forward cache, still showing the loading screen. Reload it for a
	// fresh form.
	window.addEventListener("pageshow", (event) => {
		if (event.persisted) window.location.reload();
	});
}

// Don't disable the form's fields here: disabled fields are left out of
// the post
function showLoadingScreen(form) {
	document.getElementById("arrow").innerHTML =
		'<i class="fa-solid fa-arrow-rotate-right spinner" aria-hidden="true"></i>';
	document.querySelector("h1").textContent = "Importing schedule";
	document.querySelector("h3").textContent = "Please keep this window open";

	// Fade the form out, then grow the logos and fade the status in
	form.classList.add("fade-out");
	form.addEventListener("transitionend", (event) => {
		if (event.propertyName === "opacity") {
			form.style.display = "none";
			growLogoBanner();
			document.querySelector(".app-status").classList.add("fade-in");
		}
	});
}
