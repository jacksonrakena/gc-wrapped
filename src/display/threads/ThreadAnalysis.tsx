import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useAtom, useSetAtom } from "jotai";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Layer,
  Line,
  LineChart,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  TooltipProps,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";
import { analysedAtom, selectedThreadNameAtom } from "../../analysis/state";
import { SLURS } from "../../slurs";
import { ALL_STOPWORDS } from "../../stopwords";
import { stringToColour } from "../../util/colors";
import { getPercent } from "../../util/percents";
import { DisplayMessage } from "../DisplayMessage";
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

export const ThreadAnalysis = () => {
  const setThread = useSetAtom(selectedThreadNameAtom);
  const [rawData] = useAtom(analysedAtom);
  if (rawData.state === "hasError")
    return (
      <>
        {" "}
        <Button
          onClick={() => {
            setThread(null);
          }}
        >
          Back
        </Button>
        Analysis failed: {rawData.error?.toString()}
      </>
    );
  if (rawData.state === "loading")
    return (
      <>
        {" "}
        <Button
          onClick={() => {
            setThread(null);
          }}
        >
          Back
        </Button>
        Loading...
      </>
    );
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
      <Stack spacing={8}>
        <Button
          onClick={() => {
            setThread(null);
          }}
        >
          Back
        </Button>
        <Card>
          <CardBody>
            <Stack spacing={8} direction={"row"}>
              {data.meta.imageUrl && (
                <Avatar size={"2xl"} src={data.meta.imageUrl} />
              )}
              <Stack alignItems={"start"} direction={"column"}>
                <Heading size="sm">{data.meta.title}</Heading>
                <Box>
                  Analysed {data.messages.length} messages from{" "}
                  {data.participants.length} participants in {data.totalTime}ms
                </Box>
                <Text textAlign={"left"} pt="2" fontSize="sm">
                  {data.participants.join(", ")}
                </Text>
              </Stack>
            </Stack>
          </CardBody>
        </Card>
        <Stack spacing={6}>
          <Stack spacing={4}>
            <Heading size="lg">Total messages sent</Heading>
            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={Object.entries(data.totalMessagesByAuthor)
                  .sort((b, a) => a[1] - b[1])
                  .map((ptm, i) => ({
                    name: `${ptm[0]}`,
                    count: ptm[1],
                  }))}
                dataKey="count"
                nameKey="name"
                aspectRatio={4 / 3}
              >
                <Tooltip />
              </Treemap>
            </ResponsiveContainer>
          </Stack>

          <Stack spacing={4}>
            <Heading size="lg">Total characters sent</Heading>
            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={Object.entries(data.totalCharactersByAuthor)
                  .sort((b, a) => a[1] - b[1])
                  .map((ptm, i) => ({
                    name: `${ptm[0]}`,
                    count: ptm[1],
                  }))}
                dataKey="count"
                nameKey="name"
                aspectRatio={4 / 3}
              >
                <Tooltip />
              </Treemap>
            </ResponsiveContainer>
          </Stack>

          <Stack spacing={4}>
            <Heading size="lg">Number of reactions received</Heading>

            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={Object.entries(data.reactionsReceivedByAuthor)
                  .map((ptm) => ({
                    name: ptm[0],
                    count: Object.values(ptm[1]).reduce((a, b) => a + b, 0),
                  }))
                  .sort((b, a) => a.count - b.count)}
                dataKey="count"
                nameKey="name"
                aspectRatio={4 / 3}
              >
                <Tooltip />
              </Treemap>
            </ResponsiveContainer>
          </Stack>

          <Stack spacing={4}>
            <Heading size="lg">Top 10 most used reactions</Heading>

            <Box>
              {Object.entries(data.totalReactionsByEmoji)
                .sort((b, a) => a[1] - b[1])
                .slice(0, 10)
                .map((ptm, i) => (
                  <div>
                    #{i + 1}: <strong>{ptm[0]}</strong>
                    {ptm[1]}
                  </div>
                ))}
            </Box>
          </Stack>

          <Stack spacing={4}>
            <Heading size="lg">
              Average {data.topRxn} reactions per message
            </Heading>

            <Box>
              {Object.entries(data.mostLikedUser)
                .sort((b, a) => a[1] - b[1])
                .map((ptm, i) => (
                  <div>
                    #{i + 1}: <strong>{ptm[0]}</strong>: {ptm[1]}
                  </div>
                ))}
            </Box>
          </Stack>

          <Stack spacing={4}>
            <Heading size="lg">Activity over time</Heading>

            <ResponsiveContainer width="100%" height={400}>
              <LineChart
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
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                width={900}
                height={500}
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
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                width={900}
                height={500}
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
            </ResponsiveContainer>
          </Stack>

          <Stack spacing={4}>
            <Heading size="lg">Top words</Heading>

            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={Object.entries(data.totalCountByWord)
                  .sort((a, b) => b[1] - a[1])
                  .filter((e) => !ALL_STOPWORDS.includes(e[0]))
                  .slice(0, 30)
                  .map((k, i) => ({ name: `#${i + 1}: ${k[0]}`, count: k[1] }))}
                dataKey="count"
                nameKey="name"
                aspectRatio={4 / 3}
              >
                <Tooltip />
              </Treemap>
            </ResponsiveContainer>
          </Stack>

          <Stack spacing={4}>
            <Box>
              <Heading size="lg">Naughty word usage</Heading>
              <Heading size="xs">
                Sourced from the Shutterstock List of Dirty, Naughty, Obscene,
                and Otherwise Bad Words
              </Heading>
              <Heading size="xs">
                Total count:{" "}
                {SLURS.filter((e) =>
                  Object.keys(data.totalCountByWord).includes(e)
                )
                  .map((e) => data.totalCountByWord[e])
                  .reduce((a, b) => a + b, 0)}
              </Heading>
            </Box>

            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={SLURS.filter((e) =>
                  Object.keys(data.totalCountByWord).includes(e)
                )
                  .sort(
                    (a, b) =>
                      data.totalCountByWord[b] - data.totalCountByWord[a]
                  )
                  .map((slur) => ({
                    name: slur,
                    count: data.totalCountByWord[slur],
                  }))}
                dataKey="count"
                nameKey="name"
                aspectRatio={4 / 3}
              >
                <Tooltip />
              </Treemap>
            </ResponsiveContainer>
          </Stack>
          <Stack spacing={4}>
            <Heading size="lg">Who is mentioned the most?</Heading>

            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  dataKey="count"
                  isAnimationActive={false}
                  data={Object.entries(data.totalMentionsByUser)
                    .sort((a, b) => b[1] - a[1])
                    .map((m) => ({ name: m[0], count: m[1] }))}
                  fill="#8884d8"
                  label
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Stack>

          <Stack spacing={4}>
            <Heading size="lg">Reaction distribution</Heading>

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
                        width={900}
                        height={600}
                        nodePadding={10}
                        margin={{
                          top: 20,
                          bottom: 50,
                          left: 0,
                          right: 150,
                        }}
                        data={{
                          nodes: Array.from(nodes),
                          links: Object.entries(
                            data.allReactionsByReactor
                          ).flatMap(([reactor, targets]) => {
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
                          }),
                          //.slice(0, 20),
                        }}
                        node={<MyCustomNode />}
                        link={{ stroke: "#77c878" }}
                      ></Sankey>
                    </TabPanel>
                  ))}
              </TabPanels>
            </Tabs>
          </Stack>

          <Stack spacing={4}>
            <Heading size="lg">Most {data.topRxn}'d message</Heading>

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
                  <VStack maxW={"500px"}>
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
          </Stack>
        </Stack>
      </Stack>
    </>
  );
};
