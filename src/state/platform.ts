import { atom } from "jotai";
import { virtualFileTreeAtom } from "./tree";

export const platformNameAtom = atom((get) => {
  const tree = get(virtualFileTreeAtom);
  if (!tree) return null;
  if (tree["your_facebook_activity"]) return "facebook";
  if (tree["your_instagram_activity"]) return "instagram";
  return null;
});
