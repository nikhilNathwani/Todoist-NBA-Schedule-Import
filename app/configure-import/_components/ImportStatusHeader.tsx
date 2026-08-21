"use client";

// Ported from public/scripts/ui/header/importStatus.js (now removed).
//
// NOTE: the "arrow" icon (spinner while loading / check on success /
// triangle-warning on error) is NOT rendered by this component -- in the
// original, updateHeaderStatus() reached into the LogoBanner markup
// (`document.getElementById("arrow").innerHTML = ...`) to replace the
// static right-arrow icon between the two logos. This component exports
// `STATUS_ARROWS` so PickerForm can pass the right icon down to
// <LogoBanner arrowIcon={...} /> instead -- same visual result, without
// two components fighting over one DOM node.
export type ImportUiStatus = "loading" | "success" | "error";

export const STATUS_ARROWS: Record<ImportUiStatus, React.ReactNode> = {
	loading: (
		<i className="fa-solid fa-arrow-rotate-right spinner" aria-hidden="true"></i>
	),
	success: <i className="fa-solid fa-check" aria-hidden="true"></i>,
	error: (
		<i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
	),
};

const STATUS_CONFIG: Record<ImportUiStatus, { title: string; subtitle: string }> = {
	loading: {
		title: "Importing schedule",
		subtitle: "Please keep this window open",
	},
	success: {
		title: "Import complete!",
		subtitle: "Schedule added to Todoist",
	},
	error: {
		title: "An error occurred",
		subtitle: "",
	},
};

// `subtitleOverride` replaces the default subtitle when provided (used for
// the error state to show the classified, user-facing message from the
// server action instead of a blank subtitle).
export default function ImportStatusHeader({
	status,
	subtitleOverride,
	visible,
}: {
	status: ImportUiStatus;
	subtitleOverride?: string;
	visible: boolean;
}) {
	const config = STATUS_CONFIG[status];
	return (
		<div className={`app-status ${visible ? "fade-in" : ""}`}>
			<h1>{config.title}</h1>
			<h3>{subtitleOverride || config.subtitle}</h3>
		</div>
	);
}
