import { FileWithPath } from "react-dropzone";
import {
  DeepTree,
  getDeepProperty,
  transformDeepProperty,
} from "../util/objects";

type VfsFileNode = { data: FileWithPath };
type VfsFolderNode = DeepTree<VfsFileNode>;
type VfsNode = VfsFileNode | VfsFolderNode;

export const buildVirtualFileTree = (files: FileWithPath[]): VfsFolderNode => {
  const tree: VfsFolderNode = {};
  for (const file of files) {
    const path = file.path as string;
    const components = path
      .split("/")
      .filter((e) => e)
      .slice(1);

    transformDeepProperty(tree, () => ({ data: file }), ...components);
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
  if (!item || item.data) return null;
  return item as VfsFolderNode;
};

export const resolveFileInTree = (
  node: VfsNode,
  path: string
): VfsFileNode | null => {
  const item = resolvePathInTree(node, path);
  if (!item || !item.data) return null;
  return item as VfsFileNode;
};
