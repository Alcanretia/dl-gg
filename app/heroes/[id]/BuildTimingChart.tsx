"use client";

import { useState, useRef, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { BuildItem } from "@/app/lib/getHeroBuilds";

const TYPE_COLORS: Record<string, string> = {
  weapon: "#f5a623",
  vitality: "#7ed321",
  spirit: "#9b59b6",
};

const AVG_GAME_S = 35 * 60;
const ZOOM_FACTOR = 0.75;
const MIN_RANGE = 10;
const MAX_ITEMS = 60; // only show top N items by pick rate

function secondsToMinutes(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const size = 28;
  const color = TYPE_COLORS[payload.type] ?? "#aaa";
  return (
    <g>
      <circle cx={cx} cy={cy} r={size / 2 + 3} fill={color} opacity={0.25} />
      <circle
        cx={cx}
        cy={cy}
        r={size / 2 + 3}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.6}
      />
      <image
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        href={payload.image}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item: BuildItem = payload[0].payload;
  const color = TYPE_COLORS[item.type] ?? "#aaa";
  return (
    <div className="chart-tooltip">
      <img src={item.image} alt={item.name} className="tooltip-icon" />
      <div className="tooltip-body">
        <div className="tooltip-name">{item.name}</div>
        <div className="tooltip-row">
          <span className="tooltip-label">Win Rate</span>
          <span className="tooltip-value">
            {(item.winRate * 100).toFixed(1)}%
          </span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Matches</span>
          <span className="tooltip-value">{item.matches.toLocaleString()}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Avg Buy</span>
          <span className="tooltip-value">
            {secondsToMinutes(item.avgBuyTimeS)} into game
          </span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Cost</span>
          <span className="tooltip-value">
            {item.cost.toLocaleString()} souls
          </span>
        </div>
        <div className="tooltip-type" style={{ color }}>
          {item.type}
        </div>
      </div>
    </div>
  );
};

export default function BuildTimingChart({
  byTier,
}: {
  byTier: Record<number, BuildItem[]>;
}) {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(100);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef<number | null>(null);
  const dragStartLeft = useRef(0);
  const dragStartRight = useRef(100);
  const isZoomed = left !== 0 || right !== 100;

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    isDragging.current = true;
    setIsDraggingState(true);
    dragStartX.current = e.clientX;
    dragStartLeft.current = left;
    dragStartRight.current = right;
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging.current || dragStartX.current === null) return;
    const el = containerRef.current;
    if (!el) return;

    const chartWidth = el.clientWidth;
    const range = dragStartRight.current - dragStartLeft.current;

    // convert pixel delta to domain units
    const pixelDelta = e.clientX - dragStartX.current;
    const domainDelta = (pixelDelta / chartWidth) * range * -1; // -1 so drag feels natural

    let newLeft = dragStartLeft.current + domainDelta;
    let newRight = dragStartRight.current + domainDelta;

    // clamp to 0-100 bounds
    if (newLeft < 0) {
      newRight -= newLeft;
      newLeft = 0;
    }
    if (newRight > 100) {
      newLeft -= newRight - 100;
      newRight = 100;
    }

    setLeft(Math.max(0, newLeft));
    setRight(Math.min(100, newRight));
  }

  function onMouseUp() {
    isDragging.current = false;
    setIsDraggingState(false);
    dragStartX.current = null;
  }
  // simpler zoom function called from the effect
  function zoom(deltaY: number) {
    const zoomIn = deltaY < 0;
    const range = right - left;
    const center = (left + right) / 2;

    // scale by current range so zoom feels consistent at any level
    const newRange = zoomIn
      ? Math.max(MIN_RANGE, range * ZOOM_FACTOR)
      : Math.min(100, range / ZOOM_FACTOR);

    let newLeft = Math.max(0, center - newRange / 2);
    let newRight = Math.min(100, center + newRange / 2);

    // compensate if clamped against an edge
    if (newLeft === 0) newRight = Math.min(100, newRange);
    if (newRight === 100) newLeft = Math.max(0, 100 - newRange);

    setLeft(newLeft);
    setRight(newRight);
  }

  // fix: rewrite the effect cleanly using the zoom function via ref
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      zoomRef.current(e.deltaY);
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []); // empty deps — uses ref so always has latest zoom

  // top MAX_ITEMS by match count (pick rate proxy), filter bad data
  const allData = Object.values(byTier)
    .flat()
    .filter(
      (item) =>
        item.avgBuyTimeRelative > 0 &&
        item.avgBuyTimeS > 0 &&
        item.matches > 1000,
    )
    .sort((a, b) => b.matches - a.matches)
    .slice(0, MAX_ITEMS)
    .map((item) => ({
      ...item,
      x: item.avgBuyTimeRelative + ((item.id % 7) - 3) * 1.2,
      y:
        parseFloat((item.winRate * 100).toFixed(2)) + ((item.id % 5) - 2) * 0.3,
    }));

  const data = allData.filter((item) => item.x >= left && item.x <= right);

  return (
    <div className="build-timing-chart">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">Item Timing</h2>
          <p className="chart-subtitle">
            Scroll over chart to zoom · Top {MAX_ITEMS} items by pick rate ·
            Hover for stats
          </p>
        </div>
        {isZoomed && (
          <button
            className="chart-reset-btn"
            onClick={() => {
              setLeft(0);
              setRight(100);
            }}>
            Reset Zoom
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          touchAction: "none",
          cursor: isZoomed ? (isDraggingState ? "grabbing" : "grab") : "default",
          userSelect: isDraggingState ? "none" : "auto",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp} // release drag if mouse leaves chart
      >
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 40, bottom: 50, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[left, right]}
              allowDataOverflow
              tickFormatter={(v) => secondsToMinutes((v / 100) * AVG_GAME_S)}
              stroke="#333"
              tick={{ fill: "#666", fontSize: 11 }}
              label={{
                value:
                  "← Early Game                                    Late Game →",
                position: "insideBottom",
                offset: -30,
                fill: "#555",
                fontSize: 11,
              }}
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={[45, 65]}
              allowDataOverflow
              tickFormatter={(v) => `${v}%`}
              stroke="#333"
              tick={{ fill: "#666", fontSize: 11 }}
              label={{
                value: "Win Rate",
                angle: -90,
                position: "insideLeft",
                offset: -20,
                fill: "#555",
                fontSize: 11,
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#444", strokeDasharray: "4 4" }}
            />
            <ReferenceLine
              y={50}
              stroke="#444"
              strokeDasharray="4 4"
              label={{
                value: "50% WR",
                fill: "#555",
                fontSize: 10,
                position: "right",
              }}
            />
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}
