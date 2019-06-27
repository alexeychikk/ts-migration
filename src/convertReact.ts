import { injectAt } from "./util";

export const injectWithStyles = (code: string): string => {
	if (!code.includes("withStyles(") || !code.includes("classes: Object"))
		return code;

	const injectRes = injectWithStylesType(code);
	if (!injectRes) return code;

	return injectWithStylesImport(injectRes);
};

export const replaceReactNodes = (code: string): string => {
	return code
		.replace(/React\.Element(<(any|{})>)?/gm, "React.ReactElement")
		.replace(/React\.Node(<(any|{})>)?/gm, "React.ReactNode")
		.replace(/React\.ElementRef(<(any|{})>)?/gm, "React.LegacyRef")
		.replace(/React\.AbstractComponent/gm, "React.ComponentType")
		.replace(/\bintlShape\b/gm, "InjectedIntl")
		.replace(/\bIntlShape\b/gm, "InjectedIntl")
		.replace(/\bFieldProps\b/gm, "WrappedFieldProps")
		.replace(/\$Shape\b/gm, "Partial")
		.replace(/Generator(<([A-Za-z0-9](,\s?)*)*>)?/gm, "Generator")
		.replace(
			/import Moment from "moment"/gm,
			`import { Moment } from "moment"`
		);
};

export const injectCreateStyles = (code: string, path: string): string => {
	if (!path.toLowerCase().endsWith("styles.js")) return code;
	const indexOfStyles = code.indexOf("const styles =");
	if (indexOfStyles < 0) return code;

	const codeFromStyles = code.slice(indexOfStyles);
	let injectPos = -1;
	if (codeFromStyles.startsWith("const styles = (")) {
		injectPos = codeFromStyles.indexOf("=> (");
		if (injectPos > -1) injectPos += 3;
	}
	if (injectPos < 0) return code;

	injectPos += indexOfStyles;

	code = injectAt(code, injectPos, "createStyles");
	return injectCreateStylesImport(code);
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

	code = injectAt(code, withStylesInjectPos, `WithStyles<typeof styles> & `);

	code = code.replace(/classes: Object(,|;)?/gm, "");

	return code.replace(
		/WithStyles<typeof styles> & {(\s|\n|\t)*}/gm,
		"WithStyles<typeof styles>"
	);
}

function injectCreateStylesImport(code: string): string {
	const injectPos = code.indexOf(`} from "@material-ui/core/styles"`);
	if (injectPos < 0) {
		return `import { createStyles } from "@material-ui/core/styles";\n` + code;
	}
	return injectAt(code, injectPos, ", createStyles ");
}
