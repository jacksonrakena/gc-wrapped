import {
  Avatar,
  Card,
  CardBody,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { availableThreadsAtom, selectedThreadNameAtom } from "../state/threads";

export const AllThreads = () => {
  const availableThreads = useAtomValue(availableThreadsAtom);

  const setSelectedThreadName = useSetAtom(selectedThreadNameAtom);
  return (
    <>
      {availableThreads.state === "loading" && <>Loading all threads.</>}
      {availableThreads.state === "hasError" && (
        <>Failed to load your threads: {availableThreads.error?.toString()}</>
      )}
      {availableThreads.state === "hasData" && availableThreads.data && (
        <Stack spacing={4}>
          <Heading size="md">Your threads:</Heading>
          <Stack spacing={8}>
            {availableThreads.data
              .sort(
                (a, b) =>
                  b.firstManifestMessageCount - a.firstManifestMessageCount
              )
              .map((l) => (
                <>
                  <Card
                    _hover={{ cursor: "pointer" }}
                    key={l.id}
                    onClick={() => {
                      setSelectedThreadName(l.id);
                    }}
                  >
                    <CardBody>
                      <Stack spacing={8} direction={"row"}>
                        {l.imageUrl && <Avatar size={"2xl"} src={l.imageUrl} />}
                        <Flex alignItems={"start"} direction={"column"}>
                          <Heading size="sm">{l.name}</Heading>
                          <Text
                            textColor={"GrayText"}
                            pt="2"
                            fontSize="sm"
                            textAlign={"left"}
                          >
                            {l.firstManifestMessageCount.toLocaleString()}
                            {l.isMoreThanOneManifest && "+"} messages,{" "}
                            {l.participants.length} participants
                          </Text>
                          <Text textAlign={"left"} pt="2" fontSize="sm">
                            {l.participants.map((e) => e.name).join(", ")}
                          </Text>
                        </Flex>
                      </Stack>
                    </CardBody>
                  </Card>
                </>
              ))}
          </Stack>
        </Stack>
      )}
    </>
  );
};
