"use client";

import { useEffect, useState } from "react";

// Ported from public/scripts/ui/nextSteps.js (now removed).
export default function NextStepsList({
	status,
	deepLink,
	errorMessage,
}: {
	status: "success" | "error";
	deepLink?: string;
	errorMessage?: string;
}) {
	// Mirrors the original's fadeInNextSteps(), which used
	// requestAnimationFrame after the <ul> was appended to the DOM so the
	// opacity transition (ul.fade-in in style.css) actually plays instead of
	// snapping straight to visible.
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const frame = requestAnimationFrame(() => setVisible(true));
		return () => cancelAnimationFrame(frame);
	}, []);

	return (
		<ul className={visible ? "fade-in" : ""}>
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
