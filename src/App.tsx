import { Button, VStack } from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  analysedAtom,
  listOfMessageThreads,
  selectedFilesAtom,
  selectedThreadNameAtom,
} from "./analysis/state";
import "./App.css";
import { DisplayMessage } from "./display/DisplayMessage";
import { FileDropzone } from "./files/FileDropzone";
import { SLURS } from "./slurs";
import { ALL_STOPWORDS } from "./stopwords";

const ShowData = () => {
  const [rawData] = useAtom(analysedAtom);
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
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Who likes who the most?
      </div>
      <div>
        {Object.entries(data.topEmojiTargets).map((m) => {
          let topPairs = Object.entries(m[1]).sort(
            (a, b) =>
              b[1][data.topRxn] / data.totalReactionsByUser[m[0]][data.topRxn] -
              a[1][data.topRxn] / data.totalReactionsByUser[m[0]][data.topRxn]
          );
          let topPair = topPairs[0];
          let secondPair = topPairs[1];
          return (
            <div>
              {m[0]} likes <b>{topPair[0]}</b> (
              {Math.floor(
                (topPair[1][data.topRxn] /
                  data.totalReactionsByUser[m[0]][data.topRxn]) *
                  100
              )}
              % of their {data.topRxn} reactions){" "}
              {secondPair && (
                <>
                  {" "}
                  and <b>{secondPair[0]}</b> (
                  {Math.floor(
                    (secondPair[1][data.topRxn] /
                      data.totalReactionsByUser[m[0]][data.topRxn]) *
                      100
                  )}
                  % of their {data.topRxn} reactions) the most
                </>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Most {data.topRxn} message
      </div>
      <VStack spacing={32}>
        {(() => {
          var datax = data.mostReactedMessages[data.topRxn];
          var message = datax;
          var index = data.messages.findIndex(
            (m) =>
              m.timestamp_ms == message.timestamp_ms &&
              m.sender_name == message.sender_name
          );

          return (
            <VStack>
              {index != -1 && (
                <DisplayMessage message={data.messages[index + 1]} />
              )}
              <DisplayMessage message={message} />
              {index != -1 && (
                <DisplayMessage message={data.messages[index - 1]} />
              )}
            </VStack>
          );
        })()}
      </VStack>
    </>
  );
};

function App() {
  const selectedFiles = useAtomValue(selectedFilesAtom);
  const lmt = useAtomValue(listOfMessageThreads);
  const [selectedThreadName, setSelectedThreadName] = useAtom(
    selectedThreadNameAtom
  );
  return (
    <>
      {!selectedFiles && <FileDropzone />}
      {!selectedThreadName && (
        <>
          {lmt.hasError && (
            <>The Facebook data archive you uploaded is invalid.</>
          )}
          {lmt.data && (
            <>
              <h2>Select the Messages thread you'd like to analyse:</h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {}
                {lmt.data.map((l) => (
                  <Button
                    style={{ marginBottom: "10px" }}
                    onClick={() => {
                      setSelectedThreadName(l);
                    }}
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {selectedThreadName && <ShowData />}
    </>
  );
}

export default App;
