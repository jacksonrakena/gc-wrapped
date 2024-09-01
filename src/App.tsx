import { atom, useAtom, useSetAtom } from "jotai";
import { loadable } from "jotai/utils";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import "./App.css";
import { RootSchema } from "./schema";

const pEmoji = (p: string) => {
  const r = /\\u([\d\w]{4})/gi;
  p = p.replace(r, function (match, grp) {
    return String.fromCharCode(parseInt(grp, 16));
  });
  return p;
};
async function combineFiles(files: RootSchema[]) {
  const participants = Array.from(
    new Set<string>(files.flatMap((e) => e.participants.map((e) => e.name)))
  );

  const messages = files.flatMap((e) => e.messages);

  let pToMessages: { [x: string]: number } = {};
  let pToCharacters: { [x: string]: number } = {};
  let totalReactions: { [x: string]: number } = {};
  let reactionsReceivedByAuthor: { [x: string]: { [x: string]: number } } = {};
  let totalReactionsCount = 0;

  for (const message of messages) {
    pToMessages[message.sender_name] =
      (pToMessages[message.sender_name] ?? 0) + 1;

    pToCharacters[message.sender_name] =
      (pToCharacters[message.sender_name] ?? 0) +
      (message.content?.length ?? 0);

    for (const r of message.reactions ?? []) {
      totalReactions[r.reaction] = (totalReactions[r.reaction] ?? 0) + 1;
      if (!reactionsReceivedByAuthor[message.sender_name])
        reactionsReceivedByAuthor[message.sender_name] = {};

      reactionsReceivedByAuthor[message.sender_name][r.reaction] =
        (reactionsReceivedByAuthor[message.sender_name][r.reaction] ?? 0) + 1;
    }
  }

  let topRxn = Object.entries(totalReactions).sort((b, a) => a[1] - b[1])[0][0];
  let mostLikedUser = Object.fromEntries(
    participants.map((e) => [
      e,
      (() => {
        try {
          return reactionsReceivedByAuthor[e][topRxn] / pToMessages[e];
        } catch (e) {
          return 0;
        }
      })(),
    ])
  );

  return {
    participants: participants,
    messages: messages,
    pToCharacters,
    pToMessages,
    totalReactions,
    reactionsReceivedByAuthor,
    mostLikedUser,
    topRxn,
  };
}

const rawDataAtom = atom<RootSchema[] | null>(null);
const combinedPackageAtom = loadable(
  atom(async (get) => {
    const rawData = get(rawDataAtom);
    if (!rawData) return null;
    return await combineFiles(rawData);
  })
);

const ShowData = () => {
  const [rawData] = useAtom(combinedPackageAtom);
  if (rawData.state === "hasError") return <>{rawData.error}</>;
  if (rawData.state === "loading") return <>Loading...</>;
  const data = rawData.data;
  if (!data) return <>Not loaded.</>;
  return (
    <>
      <div style={{ fontWeight: "bold", fontSize: "xl" }}>
        {data.messages.length} messages.
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>By messages</div>
      <div>
        {Object.entries(data.pToMessages)
          .sort((b, a) => a[1] - b[1])
          .map((ptm, i) => (
            <div>
              #{i + 1}: <strong>{ptm[0]}</strong>: {ptm[1]} messages (
              {Math.floor((ptm[1] / data.messages.length) * 100)}%)
            </div>
          ))}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>By characters</div>
      <div>
        {Object.entries(data.pToCharacters)
          .sort((b, a) => a[1] - b[1])
          .map((ptm, i) => (
            <div>
              #{i + 1}: <strong>{ptm[0]}</strong>: {ptm[1]} characters (
              {Math.floor(
                (ptm[1] /
                  data.messages
                    .flatMap((e) => e.content?.length ?? 0)
                    .reduce((p, a) => p + a, 0)) *
                  100
              )}
              %)
            </div>
          ))}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Number of reactions received
      </div>
      <div>
        {Object.entries(data.reactionsReceivedByAuthor)
          .sort((b, a) => a[1] - b[1])
          .map((ptm, i) => (
            <div>
              #{i + 1}: <strong>{ptm[0]}</strong>:{" "}
              {Object.values(ptm[1]).reduce((a, b) => a + b, 0)} reactions (
              {Math.floor(
                (Object.values(ptm[1]).reduce((a, b) => a + b, 0) /
                  data.messages
                    .flatMap((e) => e.content?.length ?? 0)
                    .reduce((p, a) => p + a, 0)) *
                  100
              )}
              %)
            </div>
          ))}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>Total reactions</div>
      <div>
        {Object.entries(data.totalReactions)
          .sort((b, a) => a[1] - b[1])
          .map((ptm, i) => (
            <div>
              #{i + 1}: <strong>{ptm[0]}</strong>: {ptm[1]}
            </div>
          ))}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Average {data.topRxn} reactions per message
      </div>
      <div>
        {Object.entries(data.mostLikedUser)
          .sort((b, a) => a[1] - b[1])
          .map((ptm, i) => (
            <div>
              #{i + 1}: <strong>{ptm[0]}</strong>: {ptm[1]}
            </div>
          ))}
      </div>
    </>
  );
};

const FileDropzone = () => {
  const updateAtom = useSetAtom(rawDataAtom);
  const onDrop = useCallback(
    (af: File[]) => {
      (async () => {
        updateAtom(
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
                        new TextDecoder().decode(reader.result as ArrayBuffer),
                        (k, v) => {
                          if (typeof v === "string" || v instanceof String) {
                            return decodeURIComponent(escape(v));
                          }
                          return v;
                        }
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
      })();
    },
    [updateAtom]
  );
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
  return (
    <>
      <FileDropzone />
      <ShowData />
    </>
  );
}

export default App;
