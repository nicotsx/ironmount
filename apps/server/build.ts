await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	target: "bun",
	env: "disable",
	sourcemap: true,
	minify: {
		whitespace: true,
		identifiers: true,
		syntax: true,
		keepNames: true,
	},
	external: ["ssh2"],
});
