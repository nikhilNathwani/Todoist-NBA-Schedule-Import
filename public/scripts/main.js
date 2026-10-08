/**
 * Entry point for the configure-import page (/configure-import), loaded as an ES module.
 * The server has already rendered the team list into the page; this file
 * adds the interactivity.
 * Every other script is pulled in through imports, so dependencies are
 * explicit and nothing is shared through globals.
 */

import { listenForTeamSelection } from "./events/selectTeam.js";
import { listenForFormSubmit } from "./events/submitForm.js";
import "./ui/demoBanner.js";

const form = document.querySelector("form");
const teamSelect = form.elements["team"];

listenForTeamSelection(teamSelect);
listenForFormSubmit(form);
