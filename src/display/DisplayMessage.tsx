import { Box, Divider, VStack } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { virtualFileTreeAtom } from "../analysis/state";
import { resolveFileInTree } from "../files/vfs";
import { createObjectUrl } from "../files/zip";
import { Message } from "../schema";
import { groupBy } from "../util/reduce";

export const DisplayMessage = (props: { message: Message }) => {
  const tree = useAtomValue(virtualFileTreeAtom);
  const [allPhotos, setAllPhotos] = useState<{ uri: string }[]>([]);
  useEffect(() => {
    (async () => {
      const resolvedPhotos = (
        await Promise.all(
          props.message?.photos?.map(async (photo) => {
            if (!tree) return null;
            const entry = resolveFileInTree(tree, photo.uri);
            if (!entry) return null;
            return { uri: await createObjectUrl(entry) };
          }) ?? []
        )
      ).filter((e) => !!e && !!e.uri) as { uri: string }[];
      setAllPhotos(resolvedPhotos);
    })();
  }, [props.message.photos, tree]);

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
        {allPhotos.map((photo) => (
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
