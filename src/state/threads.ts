import { atom } from "jotai";
import { loadable } from "jotai/utils";
import { resolveFolderInTree, resolveFileInTree } from "../files/vfs";
import { readEntryAsJson, createObjectUrl } from "../files/zip";
import { MessageManifestFileFormat } from "../schema";
import { platformNameAtom } from "./platform";
import { virtualFileTreeAtom } from "./tree";

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
          if (!leadFileNode) {
            console.log(
              `Skipping ${threadName} as lead message manifest does not exist`
            );
            return null;
          }
          const data = await readEntryAsJson<MessageManifestFileFormat>(
            leadFileNode
          );
          if (!data) {
            console.log(
              `Skipping ${threadName} as failed to read lead message manifest`
            );
            return null;
          }
          const image = data.image?.uri
            ? resolveFileInTree(tree, data.image?.uri)
            : null;
          const imageUrl = image ? await createObjectUrl(image) : null;
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
