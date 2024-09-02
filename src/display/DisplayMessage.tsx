import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { compositeTreeAtom, selectedFilesAtom } from "../analysis/state";
import { resolvePathInTree } from "../files/fs";
import { Message } from "../schema";

export const DisplayMessage = (props: { message: Message }) => {
  const sf = useAtomValue(selectedFilesAtom);
  const tree = useAtomValue(compositeTreeAtom);
  const allPhotosCached = useMemo(
    () =>
      (props.message.photos ?? [])
        .map((photo) => {
          if (!tree) return null;
          const fileBlob = resolvePathInTree(tree, photo.uri);
          return fileBlob
            ? { ...photo, uri: URL.createObjectURL(fileBlob.data) }
            : null;
        })
        .filter((e) => !!e),
    [props.message, tree]
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        padding: "25px",
        border: "1px solid grey",
        borderRadius: "8px",
      }}
    >
      <div style={{ fontWeight: "bold" }}>{props.message.sender_name}</div>
      <div>{props.message.content}</div>
      {allPhotosCached.map((photo) => (
        <div>
          <img style={{ maxWidth: "200px" }} src={photo.uri} />
        </div>
      ))}
    </div>
  );
};
