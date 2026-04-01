import { memo } from "react";

interface SparklinePropsI {
  data: number[];
  color: string;
  height?: number;
}

export const Sparkline: React.FC<SparklinePropsI> = memo(function Sparkline({
  data,
  color,
  height = 40,
}) {
  if (data.length < 2) return null;

  const w = 200;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      className="opacity-70"
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
});
