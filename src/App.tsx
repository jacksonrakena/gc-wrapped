import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import "./App.css";
import reactLogo from "./assets/react.svg";
import { Message, RootSchema } from "./schema";
import viteLogo from "/vite.svg";

interface CombinedPackage {
  participants: string[];
  messages: Message[];
}
async function combineFiles(files: RootSchema[]): Promise<CombinedPackage> {
  return {
    participants: Array.from(
      new Set<string>(files.flatMap((e) => e.participants.map((e) => e.name)))
    ),
    messages: files.flatMap((e) => e.messages),
  };
}

const FileDropzone = () => {
  const onDrop = useCallback((af: File[]) => {
    console.log(af);
    (async () => {
      const t0 = Date.now();
      let merged = await combineFiles(
        await Promise.all(
          af.map(
            (file) =>
              new Promise<RootSchema>((resolve, reject) => {
                try {
                  const reader = new FileReader();
                  reader.onabort = () => reject();
                  reader.onerror = () => reject();
                  reader.onload = () => {
                    const data = JSON.parse(
                      new TextDecoder().decode(reader.result as ArrayBuffer)
                    );
                    resolve(data as RootSchema);
                  };
                  reader.readAsArrayBuffer(file);
                } catch (e) {
                  reject(e);
                }
              })
          )
        )
      );
      console.log(
        `Parsed ${merged.messages.length} messages from ${
          merged.participants.length
        } participants in ${Date.now() - t0}ms`
      );
    })();
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Right here!</p>
      ) : (
        <p>
          Drop <code>message_*.json</code> files here.
        </p>
      )}
    </div>
  );
};

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <FileDropzone />
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
