import { formatDay } from "@/lib/format";

/**
 * Estimated-1RM trend, drawn by hand in SVG.
 *
 * No chart library: the accent, the type and the grid then match the rest of the
 * app exactly, the bundle stays small, and there is nothing to restyle away from
 * a library's defaults. The cost is that this does no zooming or tooltips — it
 * does not need to.
 */
export function E1rmChart({
  points,
}: {
  points: { day: string; e1rm: number }[];
}) {
  const W = 640;
  const H = 220;
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

  const values = points.map((p) => p.e1rm);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);

  // Pad the scale so a flat line does not sit on the axis, and so a rising line
  // does not touch the ceiling.
  const span = rawMax - rawMin;
  const pad = span === 0 ? Math.max(rawMax * 0.05, 2.5) : span * 0.15;
  const min = rawMin - pad;
  const max = rawMax + pad;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    points.length === 1
      ? PAD.left + plotW / 2
      : PAD.left + (i / (points.length - 1)) * plotW;

  const y = (value: number) =>
    PAD.top + plotH - ((value - min) / (max - min)) * plotH;

  const line = points.map((p, i) => `${x(i)},${y(p.e1rm)}`).join(" ");
  const area = `${PAD.left},${PAD.top + plotH} ${line} ${x(points.length - 1)},${PAD.top + plotH}`;

  const bestIndex = values.indexOf(rawMax);
  const ticks = [rawMax, (rawMax + rawMin) / 2, rawMin];

  return (
    <figure className="rounded-xl border border-line bg-surface p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Estimated one-rep max across ${points.length} sessions, from ${Math.round(rawMin)} to ${Math.round(rawMax)} kilograms`}
      >
        <defs>
          <linearGradient id="e1rm-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fill="var(--color-faint)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {points.length > 1 ? (
          <polygon points={area} fill="url(#e1rm-fill)" />
        ) : null}

        {points.length > 1 ? (
          <polyline
            points={line}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {points.map((point, i) => (
          <circle
            key={point.day}
            cx={x(i)}
            cy={y(point.e1rm)}
            r={i === bestIndex ? 5 : 3.5}
            fill={i === bestIndex ? "var(--color-accent)" : "var(--color-ground)"}
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
        ))}

        <text
          x={PAD.left}
          y={H - 8}
          fill="var(--color-faint)"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {formatDay(points[0].day)}
        </text>
        {points.length > 1 ? (
          <text
            x={W - PAD.right}
            y={H - 8}
            textAnchor="end"
            fill="var(--color-faint)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            {formatDay(points[points.length - 1].day)}
          </text>
        ) : null}
      </svg>
      <figcaption className="label mt-1 px-1">
        Estimated 1RM, kilograms
      </figcaption>
    </figure>
  );
}
