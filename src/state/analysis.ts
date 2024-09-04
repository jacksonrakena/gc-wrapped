import { atom } from "jotai";
import { loadable } from "jotai/utils";
import { analyse } from "../analysis/analysis";
import { resolveFileInTree } from "../files/vfs";
import { createObjectUrl } from "../files/zip";
import { selectedThreadMessageManifestFilesAtom } from "./threads";
import { virtualFileTreeAtom } from "./tree";

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
