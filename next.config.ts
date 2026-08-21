import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Pins the workspace root explicitly. Without this, Turbopack's root
	// inference walks up from this repo and finds an unrelated stray
	// package-lock.json in the user's home directory ($HOME), which produced
	// a spurious "ignored package-lock.json ... outside the current Git
	// repository" warning on every build. That home-directory file is
	// unrelated to this project and out of scope to touch -- this setting
	// just tells Turbopack unambiguously where the real project root is.
	turbopack: {
		root: path.resolve(__dirname),
	},
	// Deliberately NOT configuring `output: "export"` or any deployment target;
	// this branch is a local exploration only (see NEXTJS_MIGRATION_HANDOFF.md).
};

export default nextConfig;
