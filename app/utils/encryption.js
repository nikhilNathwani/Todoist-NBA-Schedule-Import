// cryptoUtils.js
import crypto from "crypto";

const algorithm = "aes-256-cbc";

function getKey() {
	const envKey = process.env.ENCRYPTION_KEY;
	if (!envKey) {
		throw new Error("ENCRYPTION_KEY environment variable is not set");
	}
	return Buffer.from(envKey, "hex");
}

function encrypt(text) {
	const key = getKey();
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(algorithm, key, iv);
	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");
	return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText) {
	const parts = encryptedText.split(":");
	const iv = Buffer.from(parts.shift(), "hex");
	const key = getKey();
	const decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(parts.join(":"), "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

export { encrypt, decrypt };
