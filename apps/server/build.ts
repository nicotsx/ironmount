await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	target: "bun",
	env: "disable",
	// sourcemap: "linked",
	minify: {
		whitespace: true,
		identifiers: true,
		syntax: true,
	},
	external: ["ssh2"],
});
