import { useSetAtom } from "jotai";
import { useDropzone } from "react-dropzone";
import { selectedFilesAtom } from "../analysis/state";

export const FileDropzone = () => {
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
            Drop your Facebook data folder here.
          </div>
        </div>
      </div>
      <div>Facebook data package analyser &copy; 2024 Jackson Rakena</div>
    </div>
  );
};
