import * as babel from "@babel/core";
// @ts-ignore
import dynamicImport from "@babel/plugin-syntax-dynamic-import";
import recast from "recast";
import fs from "fs";
import plugin from "babel-plugin-flow-to-typescript";
import { replaceReactNodes, injectWithStyles } from "convertReact";
import { promisify } from "util";
import { asyncForEach } from "./util";
import prettierFormat from "./prettierFormat";
import { stripComments } from "./stripComments";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

function recastParse(
	code: string,
	options: babel.ParserOptions,
	parse: (code: string, options: babel.ParserOptions) => File
): File {
	return recast.parse(code, {
		parser: {
			parse: (code: string) => {
				return parse(code, { ...options, tokens: true });
			}
		}
	});
}

function buildRecastGenerate(rootDir: string = global.process.cwd()) {
	return function recastGenerate(ast: File): { code: string; map?: object } {
		const file = recast.print(ast);
		file.code = prettierFormat(file.code, rootDir);
		return file;
	};
}

const recastPlugin = function(rootDir: string) {
	return {
		parserOverride: recastParse,
		generatorOverride: buildRecastGenerate(rootDir)
	};
};

export const babelOptions = (rootDir: string): babel.TransformOptions => ({
	plugins: [recastPlugin(rootDir), plugin, dynamicImport]
});

const successFiles: string[] = [];
const errorFiles: string[] = [];

export default async function convert(files: string[], rootDir: string) {
	await asyncForEach(files, async (path, i) => {
		console.log(`${i} of ${files.length}: Converting ${path}`);
		let code;
		try {
			code = (await readFile(path)).toString();
			code = injectWithStyles(code);
			const transformRes = await babel.transformAsync(
				code,
				babelOptions(rootDir)
			);
			if (!transformRes || !transformRes.code) {
				throw new Error(`Empty file after transform: '${path}'`);
			}
			code = transformRes.code;
			code = stripComments(code, ["// @flow", "// @noflow"])[0];
			code = replaceReactNodes(code);
		} catch (err) {
			console.log(err);
			errorFiles.push(path);
			return;
		}
		await writeFile(path, code);
		successFiles.push(path);
	});
	return {
		successFiles,
		errorFiles
	};
}
