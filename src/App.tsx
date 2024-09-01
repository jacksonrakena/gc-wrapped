import tokenize from "@stdlib/nlp-tokenize";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { loadable } from "jotai/utils";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";
import { RootSchema } from "./schema";
import { SLURS } from "./slurs";
import { ALL_STOPWORDS } from "./stopwords";
console.log(ALL_STOPWORDS.length);
console.log(ALL_STOPWORDS);

const IGNORE_REGEX = /(.+) reacted (.+) to your message/;

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
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Messages by month
      </div>
      <div>
        <LineChart
          width={900}
          height={300}
          data={Object.entries(data.messagesByMonth)
            .map(([k, v]) => ({
              month: k,
              count: v,
            }))
            .sort((a, b) => {
              var c = a.month.split("-");
              var aMonth = c[1];
              var aYear = c[0];
              var d = b.month.split("-");
              var bMonth = d[1];
              var bYear = d[0];
              if (aYear != bYear) return aYear - bYear;
              return aMonth - bMonth;
            })}
        >
          <Line type="monotone" dataKey="count" stroke="#8884d8" />
          <CartesianGrid stroke="#ccc" />
          <Tooltip />
          <XAxis dataKey="month" />
          <YAxis />
        </LineChart>
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>Top words</div>
      <div>
        {Object.entries(data.wordCount)
          .sort((a, b) => b[1] - a[1])
          .filter((e) => !ALL_STOPWORDS.includes(e[0]))
          .slice(0, 20)
          .map((k) => (
            <div>
              {k[0]}: {k[1]} uses
            </div>
          ))}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>Slur usage</div>
      <div>
        Sourced from the Shutterstock List of Dirty, Naughty, Obscene, and
        Otherwise Bad Words
      </div>
      <div>
        Total number of slur matches:{" "}
        {SLURS.filter((e) => Object.keys(data.wordCount).includes(e))
          .map((e) => data.wordCount[e])
          .reduce((a, b) => a + b, 0)}
      </div>
      <div>
        {SLURS.filter((e) => Object.keys(data.wordCount).includes(e)).map(
          (slur) => (
            <div>
              {slur}: {data.wordCount[slur]} uses
            </div>
          )
        )}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Who is mentioned the most?
      </div>
      <div>
        {Object.entries(data.mentions)
          .sort((a, b) => b[1] - a[1])
          .map((m) => (
            <div>
              {m[0]}: {m[1]} times
            </div>
          ))}
      </div>
    </>
  );
};

type TreeItem = { [x: string]: TreeItem } | { data: any };
const buildTree = (files: { path: string }[]): TreeItem => {
  let tree: TreeItem = {};
  for (const file of files) {
    const path = file.path as string;
    const components = path
      .split("/")
      .filter((e) => e)
      .slice(1);

    var cur = tree;
    for (let i = 0; i < components.length - 1; i++) {
      const name = components[i];
      if (!cur[name]) cur[name] = {};
      cur = cur[name];
    }
    cur[components[components.length - 1]] = {
      data: file,
    };
  }
  return tree;
};

const selectedFilesAtom = atom<{ path: string }[] | null>(null);
const compositeTreeAtom = atom((get) => {
  const rawData = get(selectedFilesAtom);
  if (!rawData) return null;
  return buildTree(rawData);
});
const listOfMessageThreads = atom((get) => {
  const tree = get(compositeTreeAtom);
  if (!tree) return null;
  const inbox = Object.keys(
    tree["your_facebook_activity"]["messages"]["inbox"]
  );
  return inbox;
});
const selectedThreadNameAtom = atom<string | null>(null);
const rawDataAtom = atom(async (get) => {
  const selectedThreadName = get(selectedThreadNameAtom);
  const tree = get(compositeTreeAtom);
  if (!selectedThreadName || !tree) return null;
  const inboxTree =
    tree["your_facebook_activity"]["messages"]["inbox"][selectedThreadName];

  const messageFiles = Object.keys(inboxTree).filter(
    (e) => e.startsWith("message_") && e.endsWith(".json")
  );

  const schemas = await Promise.all(
    messageFiles.map(
      (filename) =>
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
            reader.readAsArrayBuffer(inboxTree[filename].data);
          } catch (e) {
            reject(e);
          }
        })
    )
  );
  return schemas;
});
const combinedPackageAtom = loadable(
  atom(async (get) => {
    const rawData = await get(rawDataAtom);
    if (!rawData) return null;
    return await combineFiles(rawData);
  })
);

async function combineFiles(files: RootSchema[]) {
  console.log(files);
  try {
    const participants = Array.from(
      new Set<string>(files.flatMap((e) => e.participants.map((e) => e.name)))
    );

    const messages = files.flatMap((e) => e.messages);

    let pToMessages: { [x: string]: number } = {};
    let pToCharacters: { [x: string]: number } = {};
    let totalReactions: { [x: string]: number } = {};
    let reactionsReceivedByAuthor: { [x: string]: { [x: string]: number } } =
      {};
    let totalReactionsCount = 0;
    let messagesByMonth: { [x: string]: number } = {};
    let wordCount: { [x: string]: number } = {};
    let mentions: { [x: string]: number } = {};

    for (const message of messages) {
      if (!!message.content && IGNORE_REGEX.test(message.content)) continue;

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
      var d = new Date(message.timestamp_ms);
      var bin = `${d.getFullYear()}-${d.getMonth()}`;
      messagesByMonth[bin] = (messagesByMonth[bin] ?? 0) + 1;

      if (message.content) {
        for (const word of tokenize(message.content.toLowerCase())) {
          wordCount[word] = (wordCount[word] ?? 0) + 1;
        }
        for (let p of participants) {
          if (message.content.includes(p)) {
            mentions[p] = (mentions[p] ?? 0) + 1;
          }
        }
      }
    }

    let topRxn = Object.entries(totalReactions).sort(
      (b, a) => a[1] - b[1]
    )[0][0];
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
      messagesByMonth,
      wordCount,
      mentions,
    };
  } catch (e) {
    console.log("Error processing: ", e);
    return null;
  }
}

const FileDropzone = () => {
  const updateSelectedFilesAtom = useSetAtom(selectedFilesAtom);
  const onDrop = useCallback(
    (af: File[]) => {
      updateSelectedFilesAtom(af as never);
    },
    [updateSelectedFilesAtom]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Right here!</p>
      ) : (
        <p>Drop your Facebook data folder here.</p>
      )}
    </div>
  );
};

function App() {
  const lmt = useAtomValue(listOfMessageThreads);
  const [selectedThreadName, setSelectedThreadName] = useAtom(
    selectedThreadNameAtom
  );
  return (
    <>
      <FileDropzone />
      {!selectedThreadName && selectedFilesAtom && (
        <>
          {lmt?.map((l) => (
            <div
              onClick={() => {
                setSelectedThreadName(l);
              }}
            >
              {l}
            </div>
          ))}
        </>
      )}
      <ShowData />
    </>
  );
}

export default App;
