import { groupBy } from "lodash";
import { readFileSync, writeFileSync } from "fs";
import commit from "./commitAll";
import { getDiagnostics, getFilePath } from "./tsCompilerHelpers";
import { FilePaths } from "./cli";

export const ERROR_COMMENT = "// @quizlet-ts-ignore-errors:";

const successFiles: string[] = [];
const errorFiles: string[] = [];

export default async function run(
	paths: FilePaths,
	shouldCommit: boolean
): Promise<void> {
	const diagnostics = await getDiagnostics(paths);
	const diagnosticsWithFile = diagnostics.filter(d => !!d.file);
	const diagnosticsGroupedByFile = groupBy(
		diagnosticsWithFile,
		d => d.file!.fileName
	);

	Object.keys(diagnosticsGroupedByFile).forEach(async (fileName, i, arr) => {
		const fileDiagnostics = diagnosticsGroupedByFile[fileName];
		console.log(
			`${i} of ${arr.length - 1}: Ignoring ${
				fileDiagnostics.length
			} ts-error(s) in ${fileName}`
		);
		try {
			const filePath = getFilePath(paths, fileDiagnostics[0]);
			let codeSplitByLine = readFileSync(filePath, "utf8").split("\n");
			codeSplitByLine.unshift(`${ERROR_COMMENT}${fileDiagnostics.length}`);
			const fileData = codeSplitByLine.join("\n");
			writeFileSync(filePath, fileData);
			successFiles.push(fileName);
		} catch (e) {
			console.log(e);
			errorFiles.push(fileName);
		}
	});

	if (shouldCommit) {
		await commit("chore: 🤖 Ignored all file errors", paths);
	}

	console.log(`${successFiles.length} files with errors ignored successfully.`);
	if (errorFiles.length) {
		console.log(
			`Error checking for ignored type errors in ${errorFiles.length} files:`
		);
		console.log(errorFiles);
	}
}
