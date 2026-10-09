// Makes text safe to put inside a page's HTML. The five characters HTML
// treats as markup become their entity codes, so the browser displays them
// as text instead of interpreting them: a value like
// `<script>steal()</script>` shows up on the page literally, instead of
// running.
//
// Use it on every value inserted into HTML that isn't written in the view
// file itself (data from the schedule JSON, messages that can include text
// from Todoist). Jinja templates in Flask do this automatically; template
// strings don't, so it's done by hand here.
const HTML_ENTITIES = {
	"&": "&amp;", // first, so the other replacements aren't re-escaped
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;", // matters inside attribute values: value="..."
	"'": "&#39;",
};

export function escapeHTML(value) {
	return String(value).replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}
