process.env.CLIENT_ID = process.env.CLIENT_ID || "test-client-id";
process.env.CLIENT_SECRET = process.env.CLIENT_SECRET || "test-client-secret";
process.env.REDIRECT_URI =
	process.env.REDIRECT_URI || "http://localhost:3000/api/auth/callback";
process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || "test-cookie-secret";
process.env.ENCRYPTION_KEY =
	process.env.ENCRYPTION_KEY || "test-encryption-password-change-me";
