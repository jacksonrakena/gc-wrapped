import { FileWithPath } from "react-dropzone";

type VfsFileNode = { data: FileWithPath };
type VfsFolderNode = { [childName: string]: VfsNode };
type VfsNode = VfsFolderNode | VfsFileNode;

export const buildVirtualFileTree = (files: FileWithPath[]): VfsNode => {
  const tree: VfsNode = {};
  for (const file of files) {
    const path = file.path as string;
    const components = path
      .split("/")
      .filter((e) => e)
      .slice(1);

    let cur: VfsNode = tree;
    for (let i = 0; i < components.length - 1; i++) {
      const name = components[i];
      if (!cur[name]) cur[name] = {};
      cur = cur[name];
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
): VfsFileNode | null => {
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
  if (!cur.data) return null;
  return cur as VfsFileNode;
};
