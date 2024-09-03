import {
  Box,
  Button,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { ErrorBoundary } from "react-error-boundary";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Layer,
  Line,
  LineChart,
  Rectangle,
  Sankey,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import {
  analysedAtom,
  archiveFilesAtom,
  availableThreadsAtom,
  selectedThreadNameAtom,
} from "./analysis/state";
import "./App.css";
import { DisplayMessage } from "./display/DisplayMessage";
import { ZipDropzone } from "./files/ZipDropzone";
import { SLURS } from "./slurs";
import { ALL_STOPWORDS } from "./stopwords";
const stringToColour = (str: string) => {
  let hash = 0;
  str.split("").forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, "0");
  }
  return colour;
};
const toPercent = (decimal, fixed = 0) => `${(decimal * 100).toFixed(fixed)}%`;
const getPercent = (value, total) => {
  const ratio = total > 0 ? value / total : 0;

  return toPercent(ratio, 1);
};
const renderTooltipContent = (o: TooltipProps<number, string>) => {
  const { payload, label } = o;
  const total = payload.reduce((result, entry) => result + entry.value, 0);
  const v = payload.sort((a, b) => b.value - a.value);

  return (
    <Box
      backgroundColor={"white"}
      p={15}
      style={{ backgroundColor: "white", padding: "5px" }}
    >
      <Box>
        {label} (Total: {total})
      </Box>
      <VStack alignItems={"start"}>
        {v.map((entry, index) => (
          <Box
            key={`item-${index}`}
            style={{ color: stringToColour(entry.name) }}
          >
            {`${entry.name}: ${entry.value} (${getPercent(
              entry.value,
              total
            )})`}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

const ShowData = () => {
  const setThread = useSetAtom(selectedThreadNameAtom);
  const [rawData] = useAtom(analysedAtom);
  if (rawData.state === "hasError")
    return <>Analysis failed: {rawData.error?.toString()}</>;
  if (rawData.state === "loading") return <>Loading...</>;
  const data = rawData.data;
  if (!data) return <>Not loaded.</>;
  const allp = data.participants.map((e) => ({
    name: e,
  }));
  const nodes = allp.flatMap((p) => [
    { name: p.name + "_send" },
    { name: p.name + "_rec" },
  ]);
  const areaChartData = Object.keys(data.messagesByMonthAndAuthor)
    .flatMap((monthBin) => ({
      month: monthBin,

      ...Object.entries(data.messagesByMonthAndAuthor[monthBin])
        .map(([user, count]) => ({
          [user]: count,
        }))
        .reduce((a, b) => ({ ...a, ...b }), {}),
    }))
    .sort((a, b) => {
      const c = a.month.split("-");
      const aMonth = c[1];
      const aYear = c[0];
      const d = b.month.split("-");
      const bMonth = d[1];
      const bYear = d[0];
      if (aYear != bYear) return aYear - bYear;
      return aMonth - bMonth;
    });
  return (
    <>
      <Button
        onClick={() => {
          setThread(null);
        }}
      >
        Back
      </Button>
      <div style={{ fontWeight: "bold", fontSize: "xl" }}>
        Analysed {data.messages.length} messages from {data.participants.length}{" "}
        participants in {data.totalTime}ms.
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>By messages</div>
      <div>
        {Object.entries(data.totalMessagesByAuthor)
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
        {Object.entries(data.totalCharactersByAuthor)
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
          .map((ptm) => ({
            user: ptm[0],
            count: Object.values(ptm[1]).reduce((a, b) => a + b, 0),
          }))
          .sort((b, a) => a.count - b.count)
          .map((datax, i) => (
            <div>
              #{i + 1}: <strong>{datax.user}</strong>: {datax.count} reactions (
              {Math.floor(
                (datax.count /
                  data.messages
                    .flatMap((e) => e.reactions?.length ?? 0)
                    .reduce((p, a) => p + a, 0)) *
                  100
              )}
              %)
            </div>
          ))}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Top 10 most used reactions
      </div>
      <div>
        {Object.entries(data.totalReactionsByEmoji)
          .sort((b, a) => a[1] - b[1])
          .slice(0, 10)
          .map((ptm, i) => (
            <div>
              #{i + 1}: <strong>{ptm[0]}</strong>
              {ptm[1]}
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
        {/* <ResponsiveContainer width="100%" height="100%"> */}
        <AreaChart
          width={1200}
          height={800}
          stackOffset="expand"
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
          data={areaChartData}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis
            tickFormatter={(decimal, fixed = 0) =>
              `${(decimal * 100).toFixed(0)}%`
            }
          />
          <Tooltip content={renderTooltipContent} />
          {Array.from(
            new Set<string>(
              Object.values(data.messagesByMonthAndAuthor).flatMap((d) =>
                Object.keys(d)
              )
            )
          ).map((user) => (
            <Area
              stackId="1"
              key={user}
              fill={stringToColour(user)}
              type="monotone"
              dataKey={user}
            />
          ))}
        </AreaChart>
        {/* </ResponsiveContainer> */}
        <AreaChart
          width={1200}
          height={800}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
          data={Object.keys(data.messagesByMonthAndAuthor)
            .flatMap((monthBin) => ({
              month: monthBin,

              ...Object.entries(data.messagesByMonthAndAuthor[monthBin])
                .map(([user, count]) => ({
                  [user]: count,
                }))
                .reduce((a, b) => ({ ...a, ...b }), {}),
            }))
            .sort((a, b) => {
              const c = a.month.split("-");
              const aMonth = c[1];
              const aYear = c[0];
              const d = b.month.split("-");
              const bMonth = d[1];
              const bYear = d[0];
              if (aYear != bYear) return aYear - bYear;
              return aMonth - bMonth;
            })}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={renderTooltipContent} />
          {Array.from(
            new Set<string>(
              Object.values(data.messagesByMonthAndAuthor).flatMap((d) =>
                Object.keys(d)
              )
            )
          ).map((user) => (
            <Area
              stackId="1"
              key={user}
              fill={stringToColour(user)}
              type="monotone"
              dataKey={user}
            />
          ))}
        </AreaChart>
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>Top words</div>
      <div>
        {Object.entries(data.totalCountByWord)
          .sort((a, b) => b[1] - a[1])
          .filter((e) => !ALL_STOPWORDS.includes(e[0]))
          .slice(0, 20)
          .map((k) => (
            <div>
              {k[0]}: {k[1]} uses
            </div>
          ))}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Naughty word usage
      </div>
      <div>
        Sourced from the Shutterstock List of Dirty, Naughty, Obscene, and
        Otherwise Bad Words
      </div>
      <div>
        Total number of slur matches:{" "}
        {SLURS.filter((e) => Object.keys(data.totalCountByWord).includes(e))
          .map((e) => data.totalCountByWord[e])
          .reduce((a, b) => a + b, 0)}
      </div>
      <div>
        {SLURS.filter((e) => Object.keys(data.totalCountByWord).includes(e))
          .sort((a, b) => data.totalCountByWord[b] - data.totalCountByWord[a])
          .map((slur) => (
            <div>
              {slur}: {data.totalCountByWord[slur]} uses
            </div>
          ))}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Who is mentioned the most?
      </div>
      <div>
        {Object.entries(data.totalMentionsByUser)
          .sort((a, b) => b[1] - a[1])
          .map((m) => (
            <div>
              {m[0]}: {m[1]} times
            </div>
          ))}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Reaction distribution
      </div>
      <Tabs>
        <TabList>
          {Object.entries(data.totalReactionsByEmoji)
            .sort((b, a) => a[1] - b[1])
            .slice(0, 10)
            .map((ptm, i) => (
              <Tab>
                <strong>{ptm[0]}</strong>({ptm[1]} uses)
              </Tab>
            ))}
        </TabList>
        <TabPanels>
          {Object.entries(data.totalReactionsByEmoji)
            .sort((b, a) => a[1] - b[1])
            .slice(0, 10)
            .map((ptm, i) => (
              <TabPanel key={i}>
                <Sankey
                  width={1000}
                  height={700}
                  nodePadding={10}
                  margin={{
                    top: 50,
                    bottom: 50,
                    left: 100,
                    right: 150,
                  }}
                  data={{
                    nodes: Array.from(nodes),
                    links: Object.entries(data.allReactionsByReactor).flatMap(
                      ([reactor, targets]) => {
                        return Object.entries(targets).map(
                          ([target, emoji]) => {
                            return {
                              source: nodes.findIndex(
                                (e) => e.name == reactor + "_send"
                              ),
                              target: nodes.findIndex(
                                (e) => e.name == target + "_rec"
                              ),
                              value: emoji[ptm[0]] ?? 0,
                            };
                          }
                        );
                      }
                    ),
                    //.slice(0, 20),
                  }}
                  node={<MyCustomNode />}
                  link={{ stroke: "#77c878" }}
                ></Sankey>
              </TabPanel>
            ))}
        </TabPanels>
      </Tabs>

      <div style={{ fontWeight: "bold", fontSize: "2em" }}>
        Most {data.topRxn} message
      </div>
      <VStack spacing={32}>
        {(() => {
          const message = data.mostReactedMessageByEmoji[data.topRxn];
          if (!message) return <></>;
          const index = data.messages.findIndex(
            (m) =>
              m.timestamp_ms == message.timestamp_ms &&
              m.sender_name == message.sender_name
          );

          return (
            <VStack>
              {index < data.messages.length - 1 && (
                <DisplayMessage message={data.messages[index + 1]} />
              )}
              {message && <DisplayMessage message={message} />}
              {index >= 1 && (
                <DisplayMessage message={data.messages[index - 1]} />
              )}
            </VStack>
          );
        })()}
      </VStack>
    </>
  );
};

const MyCustomNode = ({
  x,
  y,
  width,
  height,
  index,
  payload,
  containerWidth,
}) => {
  const isOut = x + width + 6 > containerWidth;
  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={stringToColour(payload.name.split("_")[0])}
        fillOpacity="1"
      />
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        fontSize="14"
        stroke="#333"
      >
        {payload.name.split("_")[0]}
      </text>
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2 + 13}
        fontSize="12"
        stroke="#333"
        strokeOpacity="0.5"
      >
        {`${payload.value}`}
      </text>
    </Layer>
  );
};

function App() {
  const selectedFiles = useAtomValue(archiveFilesAtom);
  const lmt = useAtomValue(availableThreadsAtom);
  const [selectedThreadName, setSelectedThreadName] = useAtom(
    selectedThreadNameAtom
  );
  return (
    <>
      {(selectedFiles.state !== "hasData" || !selectedFiles.data) && (
        <>
          <ZipDropzone />
        </>
      )}
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
                    key={l}
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
      <ErrorBoundary FallbackComponent={ErrorState}>
        {selectedThreadName && <ShowData />}
      </ErrorBoundary>

      <Box mt={"48px"} color={"GrayText"}>
        Meta data package analyser &copy; 2024 Jackson Rakena
      </Box>
    </>
  );
}

const ErrorState = ({ error }: { error: unknown }) => {
  return <>There was an issue showing your analysis: {error?.toString()}</>;
};
export default App;
