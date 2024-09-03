import { Box, Heading, Link, Stack } from "@chakra-ui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { useDropzone } from "react-dropzone";
import { archiveFilesAtom, selectedFilesAtom } from "../analysis/state";

export const ZipDropzone = () => {
  const setUploadedFiles = useSetAtom(selectedFilesAtom);
  const parsedFiles = useAtomValue(archiveFilesAtom);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: setUploadedFiles,
  });

  const awaitingDrop = parsedFiles.state === "hasData" && !parsedFiles.data;

  return (
    <Stack
      spacing={8}
      direction={"column"}
      justifyContent={"start"}
      alignItems={"center"}
    >
      <Heading>Jackson's Meta archive analyser</Heading>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "60px",
            borderRadius: 10,
            backgroundColor: "grey",
          }}
        >
          <div style={{ color: "white" }}>
            {parsedFiles.state === "loading" && <>Reading your ZIP file...</>}
            {awaitingDrop && (
              <>
                Drop your Meta archive ZIP files here. If you have multiple,
                drag them all at once.
              </>
            )}
            {parsedFiles.state === "hasError" && <>{parsedFiles.error}</>}
          </div>
        </div>
      </div>
      <Stack spacing={4} maxWidth={"600px"}>
        {awaitingDrop && (
          <Box>
            <Heading size={"lg"}>Requesting your archive information</Heading>
            <Box>
              You can request your archive files in the{" "}
              <Link
                color={"blue.700"}
                href="https://accountscenter.meta.com/info_and_permissions/dyi"
              >
                Meta Accounts Center
              </Link>
              . Make sure to select <strong>at least</strong> the 'Messages'
              information type, to select the Format as 'JSON'. It is
              recommended to set the date range as all time, for best results.
              <br />
              <br />
              The Meta Analyser currently works with Instagram and Facebook
              archives, with all conversation types, including DMs and group
              chats.
            </Box>
          </Box>
        )}
        {awaitingDrop && (
          <Box>
            Meta archive files follow this format:
            <Stack>
              <Box>instagram-jacksonrakena-2024-09-02-0boqvIPd.zip</Box>
              <Box>facebook-jacksonrakena7-02_09_2024-jKOnRXtv.zip</Box>
            </Stack>
          </Box>
        )}
      </Stack>
    </Stack>
  );
};
