// encryption.ts - Uses @hapi/iron for secure encryption.
// Ported as-is from app/utils/encryption.js (now removed) -- behavior unchanged.
import Iron from "@hapi/iron";

// Encrypt sensitive data (e.g., OAuth tokens)
export async function encrypt(text: string): Promise<string> {
	const password = process.env.ENCRYPTION_KEY;
	if (!password) {
		throw new Error("ENCRYPTION_KEY environment variable is not set");
	}
	return await Iron.seal(text, password, Iron.defaults);
}

// Decrypt sealed data
export async function decrypt(sealed: string): Promise<string> {
	const password = process.env.ENCRYPTION_KEY;
	if (!password) {
		throw new Error("ENCRYPTION_KEY environment variable is not set");
	}
	return (await Iron.unseal(sealed, password, Iron.defaults)) as string;
}
