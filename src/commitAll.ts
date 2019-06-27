import simplegit from "simple-git/promise";
import { FilePaths } from "./cli";

export default async function commit(message: string, filePaths: FilePaths) {
  const git = simplegit(filePaths.rootDir);
  console.log(`Committing: "${message}"`);
  try {
    await git.add(".");
  } catch (e) {
    console.error("Error adding files to git");
    throw new Error(e);
  }

  try {
    await git.commit(message, undefined, { "-n": true });
  } catch (e) {
    console.error("Error committing files");
    throw new Error(e);
  }
}
