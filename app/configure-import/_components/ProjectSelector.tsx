"use client";

// Ported from app/views/picker.js's makeProjectPickerHTML() (markup) +
// public/scripts/ui/picker.js's updateNewProjectSubtitle() (now removed).
export default function ProjectSelector({
	canCreateProjects,
	selectedProject,
	selectedTeamName,
	onSelectProject,
}: {
	canCreateProjects: boolean;
	selectedProject: "newProject" | "inbox";
	selectedTeamName: string;
	onSelectProject: (project: "newProject" | "inbox") => void;
}) {
	const newProjectSubtitle = canCreateProjects
		? selectedTeamName
			? `Import games into a new Todoist project called "${selectedTeamName} schedule"`
			: "Import games into a new Todoist project"
		: "Project limit reached. Can't create more Todoist projects.";

	return (
		<fieldset id="projectPicker">
			<legend>2. Select Todoist project</legend>
			<label
				id="newProject"
				className={`radio-button ${canCreateProjects ? "" : "disabled"}`}
			>
				<input
					type="radio"
					name="project"
					value="newProject"
					checked={selectedProject === "newProject"}
					disabled={!canCreateProjects}
					onChange={() => onSelectProject("newProject")}
				/>
				<span>
					<strong>Create New Project</strong>
					<br />
					<small aria-live="polite">{newProjectSubtitle}</small>
				</span>
			</label>
			<label id="inbox" className="radio-button">
				<input
					type="radio"
					name="project"
					value="inbox"
					checked={selectedProject === "inbox"}
					onChange={() => onSelectProject("inbox")}
				/>
				<span>
					<strong>Inbox</strong>
					<br />
					<small>Import games into your Todoist &quot;Inbox&quot;</small>
				</span>
			</label>
		</fieldset>
	);
}
