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
import { useAtomValue, useSetAtom } from "jotai";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";
import { analyse } from "../../analysis/analysis";
import { analysedAtom, selectedThreadNameAtom } from "../../analysis/state";
import { SLURS } from "../../slurs";
import { ALL_STOPWORDS } from "../../stopwords";
import { stringToColour } from "../../util/colors";
import { DisplayMessage } from "../DisplayMessage";
import { sortMonthBin } from "./area/sort";
import { areaChartTooltip } from "./area/tooltips";
import { FlowNode } from "./sankey/FlowNode";
import { TreemapNode } from "./treemap/TreemapNode";

export const ThreadAnalysisContent = ({
  data,
}: {
  data: Awaited<ReturnType<typeof analyse>> & {
    meta: { imageUrl: string | null; title: string };
  };
}) => {
  const nodes = data.participants.flatMap((p) => [
    { name: p + "_send" },
    { name: p + "_rec" },
  ]);
  return (
    <Stack spacing={8}>
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
              content={<TreemapNode />}
              data={Object.entries(data.totalMessagesByAuthor)
                .sort((b, a) => a[1] - b[1])
                .map((ptm) => ({
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
              content={<TreemapNode />}
              data={Object.entries(data.totalCharactersByAuthor)
                .sort((b, a) => a[1] - b[1])
                .map((ptm) => ({
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
              content={<TreemapNode />}
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

        {data.mostLikedUser && (
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
        )}

        <Stack spacing={4}>
          <Heading size="lg">Activity over time</Heading>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={Object.entries(data.messagesByMonth)
                .map(([k, v]) => ({
                  month: k,
                  count: v,
                }))
                .sort((a, b) => sortMonthBin(a.month, b.month))}
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
              data={Object.keys(data.messagesByMonthAndAuthor)
                .flatMap((monthBin) => ({
                  month: monthBin,

                  ...Object.entries(data.messagesByMonthAndAuthor[monthBin])
                    .map(([user, count]) => ({
                      [user]: count,
                    }))
                    .reduce((a, b) => ({ ...a, ...b }), {}),
                }))
                .sort((a, b) => sortMonthBin(a.month, b.month))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(decimal) => `${(decimal * 100).toFixed(0)}%`}
              />
              <Tooltip content={areaChartTooltip} />
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
                .sort((a, b) => sortMonthBin(a.month, b.month))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={areaChartTooltip} />
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
              content={<TreemapNode />}
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
              Sourced from the Shutterstock List of Dirty, Naughty, Obscene, and
              Otherwise Bad Words
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
                  (a, b) => data.totalCountByWord[b] - data.totalCountByWord[a]
                )
                .map((slur) => ({
                  name: slur,
                  count: data.totalCountByWord[slur],
                }))}
              dataKey="count"
              nameKey="name"
              aspectRatio={4 / 3}
              content={<TreemapNode />}
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
                .map((ptm) => (
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
                      }}
                      node={<FlowNode />}
                      link={{ stroke: "#77c878" }}
                    ></Sankey>
                  </TabPanel>
                ))}
            </TabPanels>
          </Tabs>
        </Stack>

        {data.topRxn && (
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
        )}
      </Stack>
    </Stack>
  );
};
export const ThreadAnalysis = () => {
  const setThread = useSetAtom(selectedThreadNameAtom);
  const rawData = useAtomValue(analysedAtom);
  return (
    <Stack spacing={12}>
      <Button
        onClick={() => {
          setThread(null);
        }}
      >
        Back
      </Button>
      {rawData.state === "hasError" && (
        <Box>Analysis failed: {rawData.error?.toString()}</Box>
      )}
      {rawData.state === "loading" && <Box>Loading...</Box>}
      {rawData.state === "hasData" && rawData.data && (
        <ThreadAnalysisContent data={rawData.data} />
      )}
    </Stack>
  );
};
