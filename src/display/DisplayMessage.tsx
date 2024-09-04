import { Box, Divider, VStack } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { resolveFileInTree } from "../files/vfs";
import { createObjectUrl } from "../files/zip";
import { Message } from "../schema";
import { virtualFileTreeAtom } from "../state/tree";
import { groupBy } from "../util/reduce";

export const DisplayMessage = (props: { message: Message }) => {
  const tree = useAtomValue(virtualFileTreeAtom);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const resolvedPhotos = (
        await Promise.all(
          props.message?.photos?.map(async (photo) => {
            if (!tree) return null;
            const entry = resolveFileInTree(tree, photo.uri);
            if (!entry) return null;
            return await createObjectUrl(entry);
          }) ?? []
        )
      ).filter((e) => !!e) as string[];
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
      }}
      width={"100%"}
      fontSize={"1em"}
    >
      <Box px={"20px"} pt={"25px"} pb={"10px"} style={{ fontWeight: "bold" }}>
        {props.message.sender_name}
      </Box>
      <Divider />
      <VStack alignItems={"start"} pb={"25px"} pt={"10px"} px={"20px"}>
        <Box>{props.message.content}</Box>
        {allPhotos.map((photo) => (
          <div key={photo}>
            <img src={photo} />
          </div>
        ))}
        <VStack textAlign={"left"} alignItems={"start"}>
          {Object.entries(
            groupBy(props.message.reactions ?? [], (e) => e.reaction)
          ).map(([reaction, reactions]) => (
            <Box fontSize={"0.9em"} key={reaction} style={{ color: "grey" }}>
              {reaction} {reactions.map((e) => e.actor).join(", ")}
            </Box>
          ))}
        </VStack>

        <div style={{ color: "grey" }}>
          {new Date(props.message.timestamp_ms).toLocaleString()}
        </div>
      </VStack>
    </VStack>
  );
};
