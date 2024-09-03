import { BlobReader, Entry, ZipReader } from "@zip.js/zip.js";
import { atom } from "jotai";
import { loadable } from "jotai/utils";
import { FileWithPath } from "react-dropzone";
import {
  buildVirtualFileTree,
  resolveFileInTree,
  resolveFolderInTree,
} from "../files/vfs";
import { MessageManifestFileFormat } from "../schema";
import { analyse } from "./analysis";
import { readEntryAsJson } from "./read";

export const selectedFilesAtom = atom<FileWithPath[] | null>(null);

export const archiveFilesAtom = loadable(
  atom<Promise<Entry[] | null>>(async (get) => {
    const uploadedFiles = get(selectedFilesAtom);
    if (!uploadedFiles) return null;

    if (uploadedFiles.length === 0) throw "You didn't upload any files.";
    let entries: Entry[] = [];
    for (const file of uploadedFiles) {
      if (file.type !== "application/zip") {
        throw `file ${file.name}: expected a ZIP file, like 'facebook-your_username-02_09_2024-jKOnRXtv.zip'.`;
      }
      try {
        const zr = new ZipReader(new BlobReader(file));
        entries = entries.concat(await zr.getEntries());
      } catch (e) {
        throw `file ${file.name}: ${e}`;
      }
    }
    return entries;
  })
);

export const virtualFileTreeAtom = atom((get) => {
  const rawData = get(archiveFilesAtom);
  if (rawData.state !== "hasData" || !rawData.data) return null;
  return buildVirtualFileTree(rawData.data);
});

export const availableThreadsAtom = atom((get) => {
  const tree = get(virtualFileTreeAtom);
  if (!tree) return { hasError: false, data: null };
  const inboxNode = resolveFolderInTree(
    tree,
    "your_facebook_activity/messages/inbox"
  );
  if (!inboxNode) return { hasError: true, data: null };
  return { data: Object.keys(inboxNode), hasError: false };
});

export const selectedThreadNameAtom = atom<string | null>(null);

export const selectedThreadMessageManifestFilesAtom = atom(async (get) => {
  const selectedThreadName = get(selectedThreadNameAtom);
  const tree = get(virtualFileTreeAtom);
  if (!selectedThreadName || !tree) return null;
  const inboxTree = resolveFolderInTree(
    tree,
    `your_facebook_activity/messages/inbox/${selectedThreadName}`
  );
  if (!inboxTree) return null;

  const messageFiles = Object.keys(inboxTree).filter(
    (e) => e.startsWith("message_") && e.endsWith(".json")
  );

  const schemas = await Promise.all(
    messageFiles.map((filename) =>
      readEntryAsJson<MessageManifestFileFormat>(
        resolveFileInTree(inboxTree, filename)!
      )
    )
  );
  return schemas;
});

export const analysedAtom = loadable(
  atom(async (get) => {
    const rawData = await get(selectedThreadMessageManifestFilesAtom);
    if (!rawData) return null;
    return await analyse(rawData);
  })
);
