"use client";

// PickerForm is the state-machine owner replacing the vanilla JS spread
// across public/scripts/ui/picker.js, events/selectTeam.js,
// events/submitForm.js, and utils/transitions.js (all now removed). Those
// files coordinated through global `let`/`const` bindings and
// comment-convention ("Note: teamSelect is defined in picker.js") rather
// than imports; here `selectedTeam`, `selectedProject`, and `importStatus`
// are plain React state owned by one component and passed down as typed
// props, per the task brief.
import { useState } from "react";
import LogoBanner from "@/components/LogoBanner";
import TeamSelector from "./TeamSelector";
import ProjectSelector from "./ProjectSelector";
import ImportStatusHeader, {
	STATUS_ARROWS,
	type ImportUiStatus,
} from "./ImportStatusHeader";
import NextStepsList from "./NextStepsList";
import { importScheduleAction } from "../actions";
import type { TeamSummary } from "@/lib/parseSchedule";

// Matches transitions.js's minDurationLoadingUI (3000ms) and the 1200ms
// pause transitionToResult() added before the next-steps list was appended.
const MIN_LOADING_DURATION_MS = 3000;
const RESULT_TO_NEXT_STEPS_DELAY_MS = 1200;

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

type Phase = "form" | "submitting" | "loading" | "result";

export default function PickerForm({
	teams,
	canCreateProjects,
	mockError,
}: {
	teams: Record<string, TeamSummary>;
	canCreateProjects: boolean;
	mockError?: string;
}) {
	const [phase, setPhase] = useState<Phase>("form");
	const [selectedTeam, setSelectedTeam] = useState("");
	const [selectedTeamName, setSelectedTeamName] = useState("");
	const [selectedProject, setSelectedProject] = useState<"newProject" | "inbox">(
		canCreateProjects ? "newProject" : "inbox",
	);
	const [resultStatus, setResultStatus] = useState<"success" | "error" | null>(
		null,
	);
	const [deepLink, setDeepLink] = useState<string | undefined>();
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [showNextSteps, setShowNextSteps] = useState(false);

	const headerVisible = phase === "loading" || phase === "result";
	const headerStatus: ImportUiStatus =
		phase === "result" && resultStatus ? resultStatus : "loading";

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedTeam) return;

		const submitStart = Date.now();
		setPhase("submitting");
		// Phase advances to "loading" via the form's onTransitionEnd handler
		// below, once the CSS opacity fade actually finishes -- matching the
		// original's real transitionend listener instead of a timer guessing
		// the fade's duration.

		let result: Awaited<ReturnType<typeof importScheduleAction>>;
		try {
			result = await importScheduleAction(
				selectedTeam,
				selectedProject,
				mockError,
			);
		} catch (error) {
			result = {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Unexpected error importing schedule.",
			};
		}

		// Enforce the same minimum loading duration as the original
		// waitForLoadingUI(), measured from submit rather than from when the
		// "loading" phase visually started (the difference is however long the
		// fade-out transition takes, well under the 3s floor either way).
		const elapsed = Date.now() - submitStart;
		const remaining = MIN_LOADING_DURATION_MS - elapsed;
		if (remaining > 0) await sleep(remaining);

		if (result.success) {
			setResultStatus("success");
			setDeepLink(result.deepLink);
		} else {
			setResultStatus("error");
			setErrorMessage(result.message);
		}
		setPhase("result");

		await sleep(RESULT_TO_NEXT_STEPS_DELAY_MS);
		setShowNextSteps(true);
	}

	return (
		<div className="app-frame">
			<div className="app-header">
				<LogoBanner
					isLarge={headerVisible}
					teamId={selectedTeam || undefined}
					arrowIcon={headerVisible ? STATUS_ARROWS[headerStatus] : undefined}
				/>
				<ImportStatusHeader
					status={headerStatus}
					subtitleOverride={resultStatus === "error" ? errorMessage : undefined}
					visible={headerVisible}
				/>
			</div>
			<div className="app-content">
				{(phase === "form" || phase === "submitting") && (
					<form
						className={phase === "submitting" ? "fade-out" : ""}
						onSubmit={handleSubmit}
						onTransitionEnd={(event: React.TransitionEvent<HTMLFormElement>) => {
							// Matches the original transitions.js exactly: only
							// advance once the opacity fade (not some other
							// transitioning property) actually finishes, and only
							// while we're mid fade-out -- not on some unrelated
							// transition firing later while the form is idle.
							if (
								event.propertyName === "opacity" &&
								phase === "submitting"
							) {
								setPhase("loading");
							}
						}}
					>
						<TeamSelector
							teams={teams}
							selectedTeam={selectedTeam}
							onSelectTeam={(teamID, teamName) => {
								setSelectedTeam(teamID);
								setSelectedTeamName(teamName);
							}}
						/>
						<ProjectSelector
							canCreateProjects={canCreateProjects}
							selectedProject={selectedProject}
							selectedTeamName={selectedTeamName}
							onSelectProject={setSelectedProject}
						/>
						<button
							id="submitButton"
							className="button"
							type="submit"
							disabled={!selectedTeam}
						>
							Import schedule
						</button>
					</form>
				)}
				{phase === "result" && showNextSteps && resultStatus && (
					<NextStepsList
						status={resultStatus}
						deepLink={deepLink}
						errorMessage={errorMessage}
					/>
				)}
			</div>
		</div>
	);
}
