export const injectWithStyles = (code: string): string => {
	return code;
};

export const replaceReactNodes = (code: string): string => {
	return code
		.replace(/React.Element(<(any|{})>)?/gm, "React.ReactElement")
		.replace(/React.Node(<(any|{})>)?/gm, "React.ReactElement")
		.replace(/React.ElementRef(<(any|{})>)?/gm, "React.LegacyRef");
};
