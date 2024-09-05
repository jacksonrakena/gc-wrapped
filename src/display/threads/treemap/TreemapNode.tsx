import { TreemapNode as TreemapNodeProps } from "recharts/types/util/types";

const COLORS = [
  "#8889DD",
  "#9597E4",
  "#8DC77B",
  "#A5D297",
  "#E2CF45",
  "#F8C12D",
];
export const TreemapNode = ({
  root,
  depth,
  x,
  y,
  width,
  height,
  index,
  count,
  name,
}: TreemapNodeProps) => {
  if (!root?.children) return <></>;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill:
            depth < 2
              ? COLORS[Math.floor((index / root?.children.length) * 6)]
              : "#ffffff00",
          stroke: "#fff",
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={14}
        >
          <tspan dy="1.2em">{name}</tspan>
          <tspan x={x + width / 2} dy="1.2em">
            {count.toLocaleString()}
          </tspan>
        </text>
      ) : null}
      {depth === 1 ? (
        <text x={x + 4} y={y + 18} fill="#fff" fontSize={16} fillOpacity={0.9}>
          {index + 1}
        </text>
      ) : null}
    </g>
  );
};
