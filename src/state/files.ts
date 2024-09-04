import { Entry } from "@zip.js/zip.js";
import { atom } from "jotai";
import { loadable } from "jotai/utils";
import { FileWithPath } from "react-dropzone";
import { readZipFiles } from "../files/zip";

export const selectedFilesAtom = atom<FileWithPath[] | null>(null);

export const archiveFilesAtom = loadable(
  atom<Promise<Entry[] | null>>(async (get) => {
    const uploadedFiles = get(selectedFilesAtom);
    if (!uploadedFiles) return null;

    if (uploadedFiles.length === 0) throw "You didn't upload any files.";
    return await readZipFiles(uploadedFiles);
  })
);
