// cryptoUtils.js
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const iv = crypto.randomBytes(16);

function encrypt(text) {
	const cipher = crypto.createCipheriv(algorithm, key, iv);
	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");
	return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText) {
	const parts = encryptedText.split(":");
	const iv = Buffer.from(parts.shift(), "hex");
	const decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(parts.join(":"), "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

module.exports = { encrypt, decrypt };
