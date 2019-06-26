"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectWithStyles = (code) => {
    return code;
};
exports.replaceReactNodes = (code) => {
    return code
        .replace(/React.Element(<(any|{})>)?/gm, "React.ReactElement")
        .replace(/React.Node(<(any|{})>)?/gm, "React.ReactElement")
        .replace(/React.ElementRef(<(any|{})>)?/gm, "React.LegacyRef");
};
//# sourceMappingURL=convertReact.js.map