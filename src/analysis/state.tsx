import { Entry } from "@zip.js/zip.js";
import { atom } from "jotai";
import { loadable } from "jotai/utils";
import { FileWithPath } from "react-dropzone";
import {
  buildVirtualFileTree,
  resolveFileInTree,
  resolveFolderInTree,
} from "../files/vfs";
import { createObjectUrl, readEntryAsJson, readZipFiles } from "../files/zip";
import { MessageManifestFileFormat } from "../schema";
import { analyse } from "./analysis";

export const selectedFilesAtom = atom<FileWithPath[] | null>(null);

export const archiveFilesAtom = loadable(
  atom<Promise<Entry[] | null>>(async (get) => {
    const uploadedFiles = get(selectedFilesAtom);
    if (!uploadedFiles) return null;

    if (uploadedFiles.length === 0) throw "You didn't upload any files.";
    return await readZipFiles(uploadedFiles);
  })
);

export const virtualFileTreeAtom = atom((get) => {
  const rawData = get(archiveFilesAtom);
  if (rawData.state !== "hasData" || !rawData.data) return null;
  return buildVirtualFileTree(rawData.data);
});

export const platformNameAtom = atom((get) => {
  const tree = get(virtualFileTreeAtom);
  if (!tree) return null;
  if (tree["your_facebook_activity"]) return "facebook";
  if (tree["your_instagram_activity"]) return "instagram";
  return null;
});

export const availableThreadsAtom = loadable(
  atom(async (get) => {
    const tree = get(virtualFileTreeAtom);
    const platformName = get(platformNameAtom);
    if (!tree || !platformName) return null;
    const inboxNode = resolveFolderInTree(
      tree,
      `your_${platformName}_activity/messages/inbox`
    );
    if (!inboxNode) throw "The Meta data archive you uploaded is invalid.";

    const threadNames = (
      await Promise.all(
        Object.keys(inboxNode).map(async (threadName) => {
          const leadFileNode = resolveFileInTree(
            inboxNode,
            `${threadName}/message_1.json`
          );
          if (!leadFileNode) return null;
          const data = await readEntryAsJson<MessageManifestFileFormat>(
            leadFileNode
          );
          if (!data) return null;
          const image = data.image?.uri
            ? resolveFileInTree(tree, data.image?.uri)
            : null;
          const imageUrl = image ? await createObjectUrl(image) : null;
          if (image)
            return {
              id: threadName,
              name: data.title,
              participants: data.participants,
              imageUrl: imageUrl,
            };
        })
      )
    )
      .filter((e) => e)
      .map(
        (e) =>
          e as {
            id: string;
            name: string;
            participants: { name: string }[];
            imageUrl: string | null;
          }
      );
    return threadNames;
  })
);

export const selectedThreadNameAtom = atom<string | null>(null);

export const selectedThreadMessageManifestFilesAtom = atom(async (get) => {
  const selectedThreadName = get(selectedThreadNameAtom);
  const tree = get(virtualFileTreeAtom);
  const platformName = get(platformNameAtom);
  if (!selectedThreadName || !tree || !platformName) return null;
  const inboxTree = resolveFolderInTree(
    tree,
    `your_${platformName}_activity/messages/inbox/${selectedThreadName}`
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
    const tree = get(virtualFileTreeAtom);
    if (!tree) return null;
    const rawData = await get(selectedThreadMessageManifestFilesAtom);
    if (!rawData) return null;
    const image = rawData[0].image?.uri
      ? resolveFileInTree(tree, rawData[0].image?.uri)
      : null;
    const imageUrl = image ? await createObjectUrl(image) : null;
    return {
      ...(await analyse(rawData)),
      meta: {
        title: rawData[0].title,
        imageUrl,
      },
    };
  })
);
