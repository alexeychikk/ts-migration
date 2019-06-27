import pathUtils from "path";

import fs from "fs";

import { promisify } from "util";
import simplegit from "simple-git/promise";

import collectFiles from "./collectFiles";
import convert from "./converter";
import { asyncForEach, sleep } from "./util";
import commit from "./commitAll";
import { FilePaths } from "./cli";

const exists = promisify(fs.exists);

export default async function convertCodebase(
	filePaths: FilePaths,
	shouldCommit: boolean,
	filesFromCLI: string[] | undefined
) {
	if (filePaths && filePaths.include) {
		filePaths.include = filePaths.include.filter(
			path => !path.startsWith("node_modules")
		);
	}
	const git = simplegit(filePaths.rootDir);

	const files = filesFromCLI || (await collectFiles(filePaths));

	console.log(`Converting ${files.length} files`);
	const { successFiles, errorFiles } = await convert(files, filePaths.rootDir);

	console.log(`${successFiles.length} converted successfully.`);
	console.log(`${errorFiles.length} errors:`);
	if (errorFiles.length) {
		console.log(errorFiles);
		await revert();
	}

	const renameErrors: string[] = [];
	const snapsFound: string[] = [];
	const snapsNotFound: string[] = [];
	if (shouldCommit) {
		try {
			await commit("chore: 🤖 Converted Flow to TypeScript", filePaths);
			await sleep(1000);
		} catch (e) {
			await revert();
		}

		console.log("renaming files");

		await asyncForEach(successFiles, async (path, i) => {
			console.log(`${i + 1} of ${successFiles.length}: Renaming ${path}`);
			try {
				const { oldExt, newExt } = getExtensions(path);

				const newPath = path.replace(oldExt, newExt);
				await git.mv(path, newPath);
				if (path.includes("__tests__") || path.includes("-test")) {
					await renameSnap(path, oldExt, newExt);
				}
			} catch (e) {
				console.log(e);
				renameErrors.push(`${path}:${e.message}`);
			}
		});

		console.log(`${renameErrors.length} errors renaming files`);
		if (renameErrors.length) {
			console.log(renameErrors);
			await revert();
		}

		console.log(`Snaps found: ${snapsFound.length}`);
		console.log(`Snaps Not found: ${snapsNotFound.length}`);
		try {
			await commit("chore: 🤖 Renamed js to ts", filePaths);
			await sleep(1000);
		} catch (e) {
			await revert();
		}

		console.log(`${successFiles.length} converted successfully.`);
		console.log(`${errorFiles.length} errors`);
		if (errorFiles.length) console.log(errorFiles);
	} else {
		console.log("skipping commit in dry run mode");
	}

	async function renameSnap(path: string, oldExt: string, newExt: string) {
		const parsedPath = pathUtils.parse(path);
		const jsSnapPath = `${parsedPath.dir}/__snapshots__/${parsedPath.name}${oldExt}.snap`;
		const tsSnapPath = `${parsedPath.dir}/__snapshots__/${parsedPath.name}${newExt}.snap`;
		if (await exists(jsSnapPath)) {
			console.log(`Renaming ${jsSnapPath} to ${tsSnapPath}`);
			snapsFound.push(jsSnapPath);
			try {
				await git.mv(jsSnapPath, tsSnapPath);
			} catch (e) {
				console.log(e);
				renameErrors.push(path);
			}
		} else {
			snapsNotFound.push(jsSnapPath);
		}
	}

	function containsReact(path: string): boolean {
		const file = fs.readFileSync(path, "utf8");
		return /("react")|('react')/gm.test(file);
	}

	function getExtensions(filePath: string): { oldExt: string; newExt: string } {
		const oldExt = pathUtils.extname(filePath);
		let newExt: string;
		if (oldExt === ".jsx") newExt = ".tsx";
		else newExt = containsReact(filePath) ? ".tsx" : ".ts";
		return { oldExt, newExt };
	}

	async function revert() {
		await git.reset("hard");
		process.exit(1);
	}
}
