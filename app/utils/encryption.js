// encryption.js - Uses @hapi/iron for secure encryption
import Iron from "@hapi/iron";

// Encrypt sensitive data (e.g., OAuth tokens)
async function encrypt(text) {
	const password = process.env.ENCRYPTION_KEY;
	if (!password) {
		throw new Error("ENCRYPTION_KEY environment variable is not set");
	}
	return await Iron.seal(text, password, Iron.defaults);
}

// Decrypt sealed data
async function decrypt(sealed) {
	const password = process.env.ENCRYPTION_KEY;
	if (!password) {
		throw new Error("ENCRYPTION_KEY environment variable is not set");
	}
	return await Iron.unseal(sealed, password, Iron.defaults);
}

export { encrypt, decrypt };
