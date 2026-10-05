/**
 * Entry point for the picker page (/configure-import), loaded as an ES module.
 * Every other script is pulled in through imports, so dependencies are
 * explicit and nothing is shared through globals.
 */

import { fetchTeamData } from "./api/getTeams.js";
import { populateTeamDropdown } from "./ui/picker.js";
import { listenForTeamSelection } from "./events/selectTeam.js";
import { listenForFormSubmit } from "./events/submitForm.js";
import "./ui/demoBanner.js";

const form = document.querySelector("form");
const teamSelect = form.elements["team"];

listenForTeamSelection(teamSelect);
listenForFormSubmit(form);

const teams = await fetchTeamData();
populateTeamDropdown(teamSelect, teams);
