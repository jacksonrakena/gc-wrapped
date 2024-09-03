import { useAtomValue, useSetAtom } from "jotai";
import { useDropzone } from "react-dropzone";
import { availableThreadsAtom, selectedFilesAtom } from "../analysis/state";

export const FileDropzone = () => {
  const selectedFiles = useAtomValue(selectedFilesAtom);
  const threads = useAtomValue(availableThreadsAtom);
  const updateSelectedFiles = useSetAtom(selectedFilesAtom);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: updateSelectedFiles,
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
            {!selectedFiles && <>Drop your Facebook data folder here.</>}
            {selectedFiles && !threads && <>Loading...</>}
          </div>
        </div>
      </div>
      <div>Facebook data package analyser &copy; 2024 Jackson Rakena</div>
    </div>
  );
};
