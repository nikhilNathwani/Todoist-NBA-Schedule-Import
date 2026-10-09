import { encrypt, decrypt } from "./encryption.js";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//                                           //
//         COOKIE-SESSION I/O                //
//                                           //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

//Saves encrypted accessToken to cookie-session
async function saveAccessToken(req, accessToken) {
	const encryptedToken = await encrypt(accessToken);
	req.session.accessTokenEncrypted = encryptedToken;
}

//Decrypts accessToken from cookie-session
async function getAccessToken(req) {
	const encryptedToken = req.session.accessTokenEncrypted;
	if (!encryptedToken) {
		throw new Error("Access token is not set in the session.");
	}
	return await decrypt(encryptedToken);
}

// The outcome of the last import, saved by POST /setup for GET /result
// (routes/setup.js, routes/result.js): { ok, teamID, deepLink } on success,
// { ok: false, teamID, errorType?, message } on failure. Kept until the next
// import replaces it, so the result page can be refreshed.
function saveImportResult(req, result) {
	req.session.importResult = result;
}

// undefined if nothing has been imported in this session
function getImportResult(req) {
	return req.session.importResult;
}

// NOTE: If you uncomment printReqSession below, add it back to the export statement
// function printReqSession(req) {
// 	console.log(
// 		"ACCESS TOKEN:",
// 		req.session.accessTokenEncrypted,
// 		"REQ.SESSION:",
// 		req.session
// 	);
// }

export { saveAccessToken, getAccessToken, saveImportResult, getImportResult };
