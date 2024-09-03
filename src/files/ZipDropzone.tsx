import { useAtomValue, useSetAtom } from "jotai";
import { useDropzone } from "react-dropzone";
import { archiveFilesAtom, selectedFilesAtom } from "../analysis/state";

export const ZipDropzone = () => {
  const setUploadedFiles = useSetAtom(selectedFilesAtom);
  const parsedFiles = useAtomValue(archiveFilesAtom);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: setUploadedFiles,
  });

  return (
    <div>
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
            {parsedFiles.state === "hasData" && !parsedFiles.data && (
              <>Drop your Meta archive ZIP file here.</>
            )}
            {parsedFiles.state === "hasError" && <>{parsedFiles.error}</>}
          </div>
        </div>
      </div>
    </div>
  );
};
