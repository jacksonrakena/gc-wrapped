import { Box, VStack } from "@chakra-ui/react";
import { TooltipProps } from "recharts";
import { stringToColour } from "../../../util/colors";
import { getPercent } from "../../../util/percents";

export const areaChartTooltip = (o: TooltipProps<number, string>) => {
  const { payload, label } = o;
  if (!payload) return <></>;
  const total = payload.reduce((result, entry) => result + entry.value, 0);
  const v = payload.sort((a, b) => b.value - a.value);

  return (
    <Box backgroundColor={"white"} py={2} px={15} border={"1px solid grey"}>
      <Box>
        {label} (Total: {total})
      </Box>
      <VStack alignItems={"start"}>
        {v
          .filter((e) => e.value != 0)
          .map((entry, index) => (
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
