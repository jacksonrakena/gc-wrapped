import { FileWithPath } from "react-dropzone";
import { DeepTree } from "../util/objects";

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

    let cur: VfsFolderNode = tree;
    for (let i = 0; i < components.length - 1; i++) {
      const name = components[i];
      if (!cur[name]) cur[name] = {};
      cur = cur[name] as VfsFolderNode;
    }
    cur[components[components.length - 1]] = {
      data: file,
    };
  }
  return tree;
};

export const resolvePathInTree = (
  node: VfsNode,
  path: string
): VfsNode | null => {
  const components = path.split("/");

  let cur: VfsNode = node;
  for (let i = 0; i < components.length; i++) {
    const name = components[i];
    // file encountered too early
    if (cur.data) return null;

    // must be folder node if !cur.data
    cur = cur as VfsFolderNode;

    // next component doesn't exist as child
    if (!cur[name]) return null;
    cur = cur[name];
  }
  return cur;
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
