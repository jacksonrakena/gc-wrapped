import { atom } from "jotai";
import { buildVirtualFileTree } from "../files/vfs";
import { archiveFilesAtom } from "./files";

export const virtualFileTreeAtom = atom((get) => {
  const rawData = get(archiveFilesAtom);
  if (rawData.state !== "hasData" || !rawData.data) return null;
  return buildVirtualFileTree(rawData.data);
});
