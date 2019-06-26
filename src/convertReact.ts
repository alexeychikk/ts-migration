export const injectWithStyles = (code: string): string => {
	if (!code.includes("withStyles(") || !code.includes("classes: Object"))
		return code;

	const injectRes = injectWithStylesType(code);
	if (!injectRes) return code;

	return injectWithStylesImport(injectRes);
};

export const replaceReactNodes = (code: string): string => {
	return code
		.replace(/React.Element(<(any|{})>)?/gm, "React.ReactElement")
		.replace(/React.Node(<(any|{})>)?/gm, "React.ReactElement")
		.replace(/React.ElementRef(<(any|{})>)?/gm, "React.LegacyRef");
};

function injectWithStylesImport(code: string): string {
	if (code.includes("import { withStyles")) {
		return code.replace(
			"import { withStyles",
			"import { withStyles, WithStyles"
		);
	}

	return `import { WithStyles } from "@material-ui/core/styles";\n` + code;
}

function injectWithStylesType(code: string): string | null {
	const indexOfClasses = code.indexOf("classes: Object");
	const codeBeforeClasses = code.slice(0, indexOfClasses);
	let withStylesInjectPos = codeBeforeClasses.lastIndexOf("= {");
	if (withStylesInjectPos < 0) {
		withStylesInjectPos = codeBeforeClasses.lastIndexOf(": {");
	}
	if (withStylesInjectPos < 0) {
		return null;
	}
	withStylesInjectPos += 2;

	code =
		code.slice(0, withStylesInjectPos) +
		`WithStyles<typeof styles> & ` +
		code.slice(withStylesInjectPos);

	code = code.replace(/classes: Object(,|;)?/gm, "");

	return code.replace(
		/WithStyles<typeof styles> & {(\s|\n|\t)*}/gm,
		"WithStyles<typeof styles>"
	);
}
