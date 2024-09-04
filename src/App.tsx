import { Box, Button, Stack } from "@chakra-ui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { ErrorBoundary } from "react-error-boundary";
import { archiveFilesAtom, selectedThreadNameAtom } from "./analysis/state";
import { ThreadAnalysis } from "./display/threads/ThreadAnalysis";
import { ZipDropzone } from "./files/ZipDropzone";
import { AllThreads } from "./menus/AllThreads";

function App() {
  const selectedFiles = useAtomValue(archiveFilesAtom);
  const selectedThreadName = useAtomValue(selectedThreadNameAtom);
  return (
    <Box my={"2rem"} textAlign={"center"}>
      <Box margin={"0 auto"} maxW={"900px"} p={8}>
        {(selectedFiles.state !== "hasData" || !selectedFiles.data) && (
          <ZipDropzone />
        )}
        {!selectedThreadName && <AllThreads />}
        <ErrorBoundary FallbackComponent={ErrorState}>
          {selectedThreadName && <ThreadAnalysis />}
        </ErrorBoundary>

        <Box mt={"48px"} color={"GrayText"}>
          Meta data package analyser &copy; 2024 Jackson Rakena
        </Box>
      </Box>
    </Box>
  );
}

const ErrorState = ({ error }: { error: unknown }) => {
  const setThread = useSetAtom(selectedThreadNameAtom);
  return (
    <>
      <Stack>
        {" "}
        <Button
          onClick={() => {
            setThread(null);
          }}
        >
          Back
        </Button>
      </Stack>
      <Box>There was an issue showing your analysis: {error?.toString()}</Box>
    </>
  );
};
export default App;
