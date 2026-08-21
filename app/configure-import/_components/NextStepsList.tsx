// Ported from public/scripts/ui/nextSteps.js (now removed).
//
// The original needed a requestAnimationFrame-after-mount dance (and this
// file needed "use client" + useEffect/useState to replicate it) because
// style.css's fade-in used to be a CSS *transition*, which only animates on
// a state change after the initial paint. style.css now uses a @keyframes
// *animation* on `ul` instead, which plays automatically on mount with no
// JS trigger needed -- see KNOWN_ISSUES.md's former item #4 for the before/
// after. That's what let both the effect and the client boundary go away
// here entirely.
export default function NextStepsList({
	status,
	deepLink,
	errorMessage,
}: {
	status: "success" | "error";
	deepLink?: string;
	errorMessage?: string;
}) {
	return (
		<ul>
			{status === "success" ? (
				<SuccessSteps deepLink={deepLink ?? ""} />
			) : (
				<ErrorSteps errorMessage={errorMessage ?? ""} />
			)}
		</ul>
	);
}

function SuccessSteps({ deepLink }: { deepLink: string }) {
	return (
		<>
			<li>
				<a className="project project-game" href={deepLink} target="_blank">
					<i className="fa-solid fa-up-right-from-square"></i> Open Todoist
				</a>{" "}
				to view schedule
			</li>
			<li>
				<a className="project project-game" href="/configure-import">
					<i className="fa-solid fa-arrow-left"></i> Import another
				</a>{" "}
				schedule
			</li>
			<li>
				<a
					className="project project-game"
					href={`mailto:nnathwani36@gmail.com?subject=${encodeURIComponent(
						"Regarding NBA Todoist Import",
					)}`}
					target="_blank"
				>
					<i className="fa-regular fa-envelope"></i> Contact me
				</a>
			</li>
		</>
	);
}

function ErrorSteps({ errorMessage }: { errorMessage: string }) {
	const errorReportLink = `mailto:nnathwani36@gmail.com?subject=${encodeURIComponent(
		"Issue with NBA Todoist Import",
	)}&body=${encodeURIComponent(
		"I encountered the following error when trying to import an NBA schedule into Todoist:\n\n" +
			errorMessage,
	)}`;

	return (
		<>
			<li>
				<a className="project project-game" href={errorReportLink} target="_blank">
					<i className="fa-regular fa-envelope"></i> Send error report
				</a>
			</li>
			<li>
				<a className="project project-game" href="/configure-import">
					<i className="fa-solid fa-arrow-left"></i> Try again
				</a>
			</li>
		</>
	);
}
