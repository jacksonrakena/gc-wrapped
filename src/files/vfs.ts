import { Entry } from "@zip.js/zip.js";
import {
  DeepTree,
  getDeepProperty,
  transformDeepProperty,
} from "../util/objects";

type VfsFileNode = Entry;
type VfsFolderNode = DeepTree<VfsFileNode>;
type VfsNode = VfsFileNode | VfsFolderNode;

export const buildVirtualFileTree = (files: VfsFileNode[]): VfsFolderNode => {
  const tree: VfsFolderNode = {};
  for (const file of files) {
    if (file.directory) continue;
    const components = file.filename.split("/").filter((e) => e);

    transformDeepProperty(tree, () => file, ...components);
  }
  return tree;
};

export const resolvePathInTree = (
  node: VfsNode,
  path: string
): VfsNode | null => {
  const components = path.split("/");
  return getDeepProperty(node as VfsFolderNode, ...components);
};

export const resolveFolderInTree = (
  node: VfsNode,
  path: string
): VfsFolderNode | null => {
  const item = resolvePathInTree(node, path);
  if (!item || item.filename) return null;
  return item as VfsFolderNode;
};

export const resolveFileInTree = (
  node: VfsNode,
  path: string
): VfsFileNode | null => {
  const item = resolvePathInTree(node, path);
  if (!item || !item.filename) return null;
  return item as VfsFileNode;
};
