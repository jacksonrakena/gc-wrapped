import { Box, Divider, VStack } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { virtualFileTreeAtom } from "../analysis/state";
import { resolveFileInTree } from "../files/vfs";
import { Message } from "../schema";
import { groupBy } from "../util/reduce";

export const DisplayMessage = (props: { message: Message }) => {
  const tree = useAtomValue(virtualFileTreeAtom);
  const allPhotosCached = useMemo(
    () =>
      (props.message?.photos ?? [])
        .map((photo) => {
          if (!tree) return null;
          const fileBlob = resolveFileInTree(tree, photo.uri);
          return fileBlob
            ? { ...photo, uri: URL.createObjectURL(fileBlob.data) }
            : null;
        })
        .filter((e) => !!e),
    [props.message, tree]
  );
  if (!props.message) return <></>;
  return (
    <VStack
      alignItems={"start"}
      direction={"column"}
      style={{
        border: "1px solid grey",
        borderRadius: "8px",
        width: "600px",
      }}
    >
      <Box px={"20px"} pt={"25px"} pb={"10px"} style={{ fontWeight: "bold" }}>
        {props.message.sender_name}
      </Box>
      <Divider />
      <VStack alignItems={"start"} pb={"25px"} pt={"10px"} px={"20px"}>
        <Box>{props.message.content}</Box>
        {allPhotosCached.map((photo) => (
          <div key={photo.uri}>
            <img src={photo.uri} />
          </div>
        ))}
        {Object.entries(
          groupBy(props.message.reactions ?? [], (e) => e.reaction)
        ).map(([reaction, reactions]) => (
          <div key={reaction} style={{ color: "grey" }}>
            {reaction} {reactions.map((e) => e.actor).join(", ")}
          </div>
        ))}
        <div style={{ color: "grey" }}>
          {new Date(props.message.timestamp_ms).toLocaleString()}
        </div>
      </VStack>
    </VStack>
  );
};
