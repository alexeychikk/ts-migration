"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const promise_1 = __importDefault(require("simple-git/promise"));
const collectFiles_1 = __importDefault(require("./collectFiles"));
const converter_1 = __importDefault(require("./converter"));
const util_2 = require("./util");
const commitAll_1 = __importDefault(require("./commitAll"));
const exists = util_1.promisify(fs_1.default.exists);
function convertCodebase(filePaths, shouldCommit, filesFromCLI) {
    return __awaiter(this, void 0, void 0, function* () {
        if (filePaths && filePaths.include) {
            filePaths.include = filePaths.include.filter(path => !path.startsWith("node_modules"));
        }
        const git = promise_1.default(filePaths.rootDir);
        const files = filesFromCLI || (yield collectFiles_1.default(filePaths));
        console.log(`Converting ${files.length} files`);
        const { successFiles, errorFiles } = yield converter_1.default(files, filePaths.rootDir);
        console.log(`${successFiles.length} converted successfully.`);
        console.log(`${errorFiles.length} errors:`);
        if (errorFiles.length) {
            console.log(errorFiles);
            yield revert(1);
        }
        const renameErrors = [];
        const snapsFound = [];
        const snapsNotFound = [];
        if (shouldCommit) {
            try {
                yield commitAll_1.default("chore: 🤖 Converted Flow to TypeScript", filePaths);
                yield util_2.sleep(1000);
            }
            catch (e) {
                yield revert(1);
            }
            console.log("renaming files");
            yield util_2.asyncForEach(successFiles, (path, i) => __awaiter(this, void 0, void 0, function* () {
                console.log(`${i + 1} of ${successFiles.length}: Renaming ${path}`);
                try {
                    const { oldExt, newExt } = getExtensions(path);
                    const newPath = path.replace(oldExt, newExt);
                    yield git.mv(path, newPath);
                    if (path.includes("__tests__") || path.includes("-test")) {
                        yield renameSnap(path, oldExt, newExt);
                    }
                }
                catch (e) {
                    console.log(e);
                    renameErrors.push(`${path}:${e.message}`);
                }
            }));
            console.log(`${renameErrors.length} errors renaming files`);
            if (renameErrors.length) {
                console.log(renameErrors);
                yield revert(2);
            }
            console.log(`Snaps found: ${snapsFound.length}`);
            console.log(`Snaps Not found: ${snapsNotFound.length}`);
            try {
                yield commitAll_1.default("chore: 🤖 Renamed js to ts", filePaths);
                yield util_2.sleep(1000);
            }
            catch (e) {
                yield revert(2);
            }
            console.log(`${successFiles.length} converted successfully.`);
            console.log(`${errorFiles.length} errors`);
            if (errorFiles.length)
                console.log(errorFiles);
        }
        else {
            console.log("skipping commit in dry run mode");
        }
        function renameSnap(path, oldExt, newExt) {
            return __awaiter(this, void 0, void 0, function* () {
                const parsedPath = path_1.default.parse(path);
                const jsSnapPath = `${parsedPath.dir}/__snapshots__/${parsedPath.name}${oldExt}.snap`;
                const tsSnapPath = `${parsedPath.dir}/__snapshots__/${parsedPath.name}${newExt}.snap`;
                if (yield exists(jsSnapPath)) {
                    console.log(`Renaming ${jsSnapPath} to ${tsSnapPath}`);
                    snapsFound.push(jsSnapPath);
                    try {
                        yield git.mv(jsSnapPath, tsSnapPath);
                    }
                    catch (e) {
                        console.log(e);
                        renameErrors.push(path);
                    }
                }
                else {
                    snapsNotFound.push(jsSnapPath);
                }
            });
        }
        function containsReact(path) {
            const file = fs_1.default.readFileSync(path, "utf8");
            return /("react")|('react')/gm.test(file);
        }
        function getExtensions(filePath) {
            const oldExt = path_1.default.extname(filePath);
            let newExt;
            if (oldExt === ".jsx")
                newExt = ".tsx";
            else
                newExt = containsReact(filePath) ? ".tsx" : ".ts";
            return { oldExt, newExt };
        }
        function revert(commitsBefore = 0) {
            return __awaiter(this, void 0, void 0, function* () {
                yield (commitsBefore
                    ? git.reset(["--hard", `HEAD~${commitsBefore}`])
                    : git.reset("hard"));
                process.exit(1);
            });
        }
    });
}
exports.default = convertCodebase;
//# sourceMappingURL=convertCodebase.js.map