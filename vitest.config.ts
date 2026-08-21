import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			// Mirrors tsconfig.json's "@/*" path mapping so tests can import
			// "@/lib/..." etc the same way app code does.
			"@": path.resolve(__dirname, "."),
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		setupFiles: ["./tests/setup/env.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			reportsDirectory: "coverage",
			include: ["lib/**", "app/**/route.ts", "app/**/actions.ts"],
			exclude: [
				"public/**",
				"scrape/**",
				"demo/**",
				"data/**",
				"vitest.config.ts",
				"**/*.tsx",
			],
		},
	},
});
