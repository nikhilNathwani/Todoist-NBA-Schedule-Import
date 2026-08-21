"use client";

// PickerForm is the state-machine owner replacing the vanilla JS spread
// across public/scripts/ui/picker.js, events/selectTeam.js,
// events/submitForm.js, and utils/transitions.js (all now removed). Those
// files coordinated through global `let`/`const` bindings and
// comment-convention ("Note: teamSelect is defined in picker.js") rather
// than imports; here `selectedTeam`, `selectedProject`, and the submit flow
// are plain React state owned by one component and passed down as typed
// props, per the task brief.
import { useReducer, useState } from "react";
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

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Submit flow as a reducer, not five separate useState calls.
//
// The earlier version had `phase`, `resultStatus`, `deepLink`, `errorMessage`,
// and `showNextSteps` as independent useState -- nothing stopped, say, a
// "result" render with resultStatus still null, or deepLink set while
// resultStatus was "error". In practice every call site happened to set the
// related ones together in the same batch, so it never actually misfired --
// but that was a habit to maintain, not something the types enforced.
//
// This mirrors the auth state machine in the Slidemoji project (see its
// INTERVIEW_STORIES.md, Story 2): a discriminated union + reducer makes the
// impossible combinations un-representable instead of just currently-true.
// Team/project selection below stays as plain useState deliberately -- it's
// simple, independent input state with no interdependent-transition risk,
// so folding it into this reducer too would just be mixing unrelated concerns.
type SubmitState =
	| { phase: "form" }
	| { phase: "submitting" }
	| { phase: "loading" }
	| { phase: "result"; status: "success"; deepLink: string; showNextSteps: boolean }
	| { phase: "result"; status: "error"; errorMessage: string; showNextSteps: boolean };

type SubmitAction =
	| { type: "SUBMIT_START" }
	| { type: "FADE_OUT_COMPLETE" }
	| { type: "RESULT_SUCCESS"; deepLink: string }
	| { type: "RESULT_ERROR"; message: string }
	| { type: "SHOW_NEXT_STEPS" };

function submitReducer(state: SubmitState, action: SubmitAction): SubmitState {
	switch (action.type) {
		case "SUBMIT_START":
			return { phase: "submitting" };
		case "FADE_OUT_COMPLETE":
			// Only a real transition, not a stray transitionend firing after
			// we've already moved on, should advance the phase.
			return state.phase === "submitting" ? { phase: "loading" } : state;
		case "RESULT_SUCCESS":
			return {
				phase: "result",
				status: "success",
				deepLink: action.deepLink,
				showNextSteps: false,
			};
		case "RESULT_ERROR":
			return {
				phase: "result",
				status: "error",
				errorMessage: action.message,
				showNextSteps: false,
			};
		case "SHOW_NEXT_STEPS":
			return state.phase === "result" ? { ...state, showNextSteps: true } : state;
	}
}

export default function PickerForm({
	teams,
	canCreateProjects,
	mockError,
}: {
	teams: Record<string, TeamSummary>;
	canCreateProjects: boolean;
	mockError?: string;
}) {
	const [selectedTeam, setSelectedTeam] = useState("");
	const [selectedTeamName, setSelectedTeamName] = useState("");
	const [selectedProject, setSelectedProject] = useState<"newProject" | "inbox">(
		canCreateProjects ? "newProject" : "inbox",
	);
	const [state, dispatch] = useReducer(submitReducer, { phase: "form" });

	const headerVisible = state.phase === "loading" || state.phase === "result";
	const headerStatus: ImportUiStatus =
		state.phase === "result" ? state.status : "loading";

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		// state.phase !== "form" guards against a double-submit (double-click,
		// or a duplicate form-submit event) firing importScheduleAction twice
		// concurrently -- found by testing exactly this against a real account
		// near its project limit: the first call fully succeeded (created the
		// project + imported games) while a second, later-resolving call's own
		// pre-check correctly saw the now-updated count and returned "limit
		// reached" -- and that second, misleading result was what displayed,
		// even though the import had actually worked.
		if (!selectedTeam || state.phase !== "form") return;

		const submitStart = Date.now();
		dispatch({ type: "SUBMIT_START" });
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
			dispatch({ type: "RESULT_SUCCESS", deepLink: result.deepLink });
		} else {
			dispatch({ type: "RESULT_ERROR", message: result.message });
		}

		await sleep(RESULT_TO_NEXT_STEPS_DELAY_MS);
		dispatch({ type: "SHOW_NEXT_STEPS" });
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
					subtitleOverride={
						state.phase === "result" && state.status === "error"
							? state.errorMessage
							: undefined
					}
					visible={headerVisible}
				/>
			</div>
			<div className="app-content">
				{(state.phase === "form" || state.phase === "submitting") && (
					<form
						className={state.phase === "submitting" ? "fade-out" : ""}
						onSubmit={handleSubmit}
						onTransitionEnd={(event: React.TransitionEvent<HTMLFormElement>) => {
							// Matches the original transitions.js exactly: only
							// advance once the opacity fade (not some other
							// transitioning property) actually finishes, and only
							// while we're mid fade-out -- not on some unrelated
							// transition firing later while the form is idle.
							if (
								event.propertyName === "opacity" &&
								state.phase === "submitting"
							) {
								dispatch({ type: "FADE_OUT_COMPLETE" });
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
							disabled={!selectedTeam || state.phase !== "form"}
						>
							Import schedule
						</button>
					</form>
				)}
				{state.phase === "result" && state.showNextSteps && (
					<NextStepsList
						status={state.status}
						deepLink={state.status === "success" ? state.deepLink : undefined}
						errorMessage={state.status === "error" ? state.errorMessage : undefined}
					/>
				)}
			</div>
		</div>
	);
}
