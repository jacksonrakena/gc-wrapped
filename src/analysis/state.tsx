import { atom } from "jotai";
import { loadable } from "jotai/utils";
import { FileWithPath } from "react-dropzone";
import { MessageManifestFileFormat } from "../schema";
import { analyse } from "./analysis";
import { buildVirtualFileTree } from "../files/fs";
import { readDroppedFile } from "./read";

export const selectedFilesAtom = atom<FileWithPath[] | null>(null);

export const compositeTreeAtom = atom((get) => {
  const rawData = get(selectedFilesAtom);
  if (!rawData) return null;
  return buildVirtualFileTree(rawData);
});

export const listOfMessageThreads = atom((get) => {
  const tree = get(compositeTreeAtom);
  if (!tree) return null;
  const inbox = Object.keys(
    tree["your_facebook_activity"]["messages"]["inbox"]
  );
  return inbox;
});

export const selectedThreadNameAtom = atom<string | null>(null);

export const selectedThreadMessageManifestFilesAtom = atom(async (get) => {
  const selectedThreadName = get(selectedThreadNameAtom);
  const tree = get(compositeTreeAtom);
  if (!selectedThreadName || !tree) return null;
  const inboxTree =
    tree["your_facebook_activity"]["messages"]["inbox"][selectedThreadName];

  const messageFiles = Object.keys(inboxTree).filter(
    (e) => e.startsWith("message_") && e.endsWith(".json")
  );

  const schemas = await Promise.all(
    messageFiles.map((filename) =>
      readDroppedFile<MessageManifestFileFormat>(inboxTree[filename].data)
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
