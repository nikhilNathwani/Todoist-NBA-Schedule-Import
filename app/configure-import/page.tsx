import type { Metadata } from "next";
import { getAccessToken } from "@/lib/cookieSession";
import { userReachedProjectLimit } from "@/lib/todoist";
import { getTeams } from "@/lib/parseSchedule";
import { isClassifiedTodoistError } from "@/lib/todoistErrors";
import PickerForm from "./_components/PickerForm";
import DemoBanner from "./_components/DemoBanner";
import ErrorPage from "@/components/ErrorPage";

export const metadata: Metadata = {
	title: "Select Team and Project Settings",
};

// This page can't be statically generated/ISR'd like app/page.tsx -- it
// reads the per-user session cookie and calls the live Todoist API for a
// per-user project-count check, so it must run per-request.
export const dynamic = "force-dynamic";

// Ported from app/routes/pages/picker.js (now removed). Reads the session
// cookie, checks the project limit, and renders either the picker form or a
// classified error page -- same flow, now a Server Component.
//
// KNOWN LIMITATION (see components/ErrorPage.tsx and
// NEXTJS_MIGRATION_HANDOFF.md): the original set a specific HTTP status
// (401/429/502/500) on this response. A Server Component page in the App
// Router has no API to set an arbitrary response status, so this page
// always responds 200 even when rendering the error content. Documented,
// not silently dropped.
export default async function ConfigureImportPage({
	searchParams,
}: {
	searchParams: Promise<{ mockTodoistError?: string }>;
}) {
	const params = await searchParams;
	// Gate: ?mockTodoistError is only honored when this is explicitly enabled
	// (see .env.example) -- disabled by default so it can't be triggered on a
	// real deployment unless deliberately turned on for a demo.
	const errorDemoEnabled = process.env.ENABLE_ERROR_DEMO === "true";
	const mockErrorCode = errorDemoEnabled ? params.mockTodoistError : undefined;

	try {
		const accessToken = await getAccessToken();
		const canCreateProjects = !(await userReachedProjectLimit(
			accessToken,
			mockErrorCode,
		));
		// Server Component reads the schedule JSON directly (see
		// lib/parseSchedule.ts) instead of the original's client-side
		// fetch("/api/get-teams") round trip -- see
		// NEXTJS_MIGRATION_HANDOFF.md "Server-side team data" for why.
		const teams = await getTeams();

		return (
			<main>
				<DemoBanner mockError={mockErrorCode} />
				<PickerForm
					teams={teams}
					canCreateProjects={canCreateProjects}
					mockError={mockErrorCode}
				/>
			</main>
		);
	} catch (error) {
		console.error("Error rendering picker page:", error);
		return (
			<main>
				<DemoBanner mockError={mockErrorCode} />
				{isClassifiedTodoistError(error) ? (
					<ErrorPage
						todoistErrorType={error.todoistErrorType}
						message={error.message}
					/>
				) : (
					<ErrorPage message="An error occurred" />
				)}
			</main>
		);
	}
}
