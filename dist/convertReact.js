"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectWithStyles = (code) => {
    if (!code.includes("withStyles(") || !code.includes("classes: Object"))
        return code;
    const injectRes = injectWithStylesType(code);
    if (!injectRes)
        return code;
    return injectWithStylesImport(injectRes);
};
exports.replaceReactNodes = (code) => {
    return code
        .replace(/React.Element(<(any|{})>)?/gm, "React.ReactElement")
        .replace(/React.Node(<(any|{})>)?/gm, "React.ReactElement")
        .replace(/React.ElementRef(<(any|{})>)?/gm, "React.LegacyRef");
};
function injectWithStylesImport(code) {
    if (code.includes("import { withStyles")) {
        return code.replace("import { withStyles", "import { withStyles, WithStyles");
    }
    return `import { WithStyles } from "@material-ui/core/styles";\n` + code;
}
function injectWithStylesType(code) {
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
    return code.replace(/WithStyles<typeof styles> & {(\s|\n|\t)*}/gm, "WithStyles<typeof styles>");
}
//# sourceMappingURL=convertReact.js.map