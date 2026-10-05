import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.js"],
		setupFiles: ["./tests/setup/env.js"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			reportsDirectory: "coverage",
			exclude: [
				"public/**",
				"scrape/**",
				"demo/**",
				"data/**",
				"server.js",
				"vitest.config.js",
			],
		},
	},
});
