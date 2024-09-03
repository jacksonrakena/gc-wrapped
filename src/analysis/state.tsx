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
import { readDroppedFileJson } from "./read";

export const selectedFilesAtom = atom<FileWithPath[] | null>(null);

export const virtualFileTreeAtom = atom((get) => {
  const rawData = get(selectedFilesAtom);
  if (!rawData) return null;
  return buildVirtualFileTree(rawData);
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
      readDroppedFileJson<MessageManifestFileFormat>(
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
