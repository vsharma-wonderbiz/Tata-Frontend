import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SignalChart from "@/components/ui/SignalChart";

import {
  getPlants,
  getStacksByPlant,
  getMappingsByStack,
} from "../api/assetApi";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { getAnalyticsData, getKpisByStack } from "../api/analyticsApi";
import { getTimeRange, formatChartData } from "../utils/time";

import type { Plant, Stack, Mapping } from "../api/assetApi";

// ── Loader ──────────────────────────────────────────────────────────────────
function ChartLoader() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-3">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm text-gray-400 dark:text-gray-500">Loading signal data…</p>
    </div>
  );
}

// ── Compare colours ──────────────────────────────────────────────────────────
const COMPARE_COLORS = ["#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ef4444"];

// ── Merged chart for compare mode ───────────────────────────────────────────
function CompareChart({
  seriesList,
}: {
  seriesList: { stackName: string; data: any[]; color: string }[];
}) {
  if (seriesList.length === 0) return null;

  // Merge all series into one array keyed by `time`
  const merged: Record<string, any> = {};
  seriesList.forEach(({ stackName, data }) => {
    data.forEach((point) => {
      if (!merged[point.time]) merged[point.time] = { time: point.time };
      merged[point.time][stackName] = point.value;
    });
  });

  console.log(merged)
  const mergedData = Object.values(merged).sort((a, b) =>
    a.time < b.time ? -1 : 1
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={mergedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {seriesList.map(({ stackName, color }) => (
          <Line
            key={stackName}
            type="monotone"
            dataKey={stackName}
            stroke={color}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Signals() {

  type Payload = {
    AssetName: string;
    TagName: string;
    StartTime: string;
    EndTime: string;
  };


  const [timeRange, setTimeRange] = useState<
    "1h" | "24h" | "7d" | "30d" | "custom"
  >("24h");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [signals, setSignals] = useState<Mapping[]>([]);

  const [selectedPlant, setSelectedPlant] = useState<number | "">("");
  const [selectedStack, setSelectedStack] = useState<number | "">("");
  const [selectedSignal, setSelectedSignal] = useState<string>("");
  const [chartData, setChartData] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [kpiWeek, setKpiWeek] = useState<number | null>(null);

  // ── Loading state ──────────────────────────────────────────────────────────
  const [chartLoading, setChartLoading] = useState<any>(false);

  // ── Compare mode state ─────────────────────────────────────────────────────
  const [compareMode, setCompareMode] = useState(false);
  const [comparePayload, SetComparepayload] = useState<Payload[]>([])
  // Each compare stack: { stackId, stackName, signal, data, color }
  const [compareRows, setCompareRows] = useState<
    {
      id: number; // unique row key
      stackId: number | "";
      stackName: string;
      signals: Mapping[];
      selectedSignal: string;
      data: any[];
      color: string;
      loading: boolean;
    }[]
  >([]);

  // console.log(compareRows)
  // console.log(stacks);

  // ── Fetch Plants ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const data = await getPlants();
        setPlants(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlants();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const buildPayload = (assetName: string, tagName: string) => {
    let startTime: string | undefined;
    let endTime: string | undefined;

    if (timeRange === "custom") {
      if (!customStart || !customEnd) return null;
      startTime = customStart.toISOString();
      endTime = customEnd.toISOString();
    } else {
      const time = getTimeRange(timeRange);
      if (!time) return null;
      startTime = time.startTime;
      endTime = time.endTime;
    }

    return { AssetName: assetName, TagName: tagName, StartTime: startTime, EndTime: endTime };
  };

  // ── Normal mode handlers ───────────────────────────────────────────────────
  const handlePlantChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const plantId = Number(e.target.value);
    setSelectedPlant(plantId);
    try {
      const data = await getStacksByPlant(plantId);
      setStacks(data);
      setSignals([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStackChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stackId = Number(e.target.value);
    if (!stackId) return;
    setSelectedStack(stackId);
    try {
      const mappingData = await getMappingsByStack(stackId);
      setSignals(mappingData);

      const stack = stacks.find((s) => s.assetId === stackId);
      if (!stack) return;

      const kpiResponse = await getKpisByStack(stack.name);
      if (!kpiResponse || !kpiResponse.data) return;
      setKpiData(kpiResponse.data);
      setKpiWeek(kpiResponse.week);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignalChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tagName = e.target.value;
    setSelectedSignal(tagName);
    if (!selectedStack || !tagName) return;
    try {
      setChartLoading(true);
      const stack = stacks.find((s) => s.assetId === selectedStack);
      if (!stack) return;
      const payload = buildPayload(stack.name, tagName);
      if (!payload) return;
      const data = await getAnalyticsData(payload);
      const formattedData = formatChartData([data], timeRange);
      setChartData(formattedData);
      console.log(chartData)
    } catch (err) {
      console.error(err);
    } finally {
      setChartLoading(false);
    }
  };

  // ── Compare mode handlers ──────────────────────────────────────────────────
  const addCompareRow = () => {
    setCompareRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        stackId: "",
        stackName: "",
        signals: [],
        selectedSignal: "",
        data: [],
        color: COMPARE_COLORS[prev.length % COMPARE_COLORS.length],
        loading: false,
      },
    ]);
  };

  const removeCompareRow = (id: number) => {
    setCompareRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCompareStackChange = async (id: number, stackId: number) => {
    const stack = stacks.find((s) => s.assetId === stackId);
    if (!stack) return;

    try {
      const mappingData = await getMappingsByStack(stackId);
      setCompareRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, stackId, stackName: stack.name, signals: mappingData, selectedSignal: "", data: [] }
            : r
        )
      );
      //   SetComparepayload((prev) =>
      //   prev.filter((p) => p.AssetName !== stack.name)
      //  );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompareSignalChange = async (id: number, tagName: string) => {
    setCompareRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selectedSignal: tagName, loading: true } : r))
    );

    const row = compareRows.find((r) => r.id === id);
    if (!row || !row.stackName || !tagName) return;

    try {
      const payload = buildPayload(row.stackName, tagName);
      if (payload) {
        SetComparepayload((prevPayload) => [...prevPayload, payload]);
      } else {
        return
      }

      // const data = await getAnalyticsData(payload);
      // const formattedData = formatChartData(data.values, timeRange);
      // setCompareRows((prev) =>
      //   prev.map((r) => (r.id === id ? { ...r, data: formattedData, loading: false } : r))
      // );
    } catch (err) {
      console.error(err);
      setCompareRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, loading: false } : r))
      );
    }
  };

  useEffect(() => {
    console.log("comparePayload updated:", comparePayload);
  }, [comparePayload]);


  const getCompareAnalyticsData = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (comparePayload.length === 0) return;

    try {
      setChartLoading(true);
      const promises = comparePayload.map((p) => getAnalyticsData(p));
      const results = await Promise.all(promises);
      const formatted = formatChartData(results, timeRange);
      setChartData(formatted);

      // ✅ Reset all compare rows loading state
      setCompareRows((prev) => prev.map((r) => ({ ...r, loading: false })));
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setCompareRows((prev) => prev.map((r) => ({ ...r, loading: false })));
    } finally {
      setChartLoading(false);
    }
  };


  const handleClearCompare = () => {
    setCompareRows([]);
    SetComparepayload([]);
    setChartData([]);
  };

  useEffect(() => {
    console.log("chartData updated:", chartData);
  }, [chartData]);



  const compareSeriesList = compareRows
    .filter((r) => r.data.length > 0)
    .map((r) => ({ stackName: r.stackName, data: r.data, color: r.color }));

  const isCompareChartLoading = compareRows.some((r) => r.loading);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Signals
        </h2>

        {/* Compare toggle */}
        <button
          onClick={() => {
            setCompareMode((v) => !v);
            setCompareRows([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${compareMode
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
        >
          {compareMode ? "✕ Exit Compare" : "⇄ Compare Signals"}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-end gap-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow justify-between">
        {/* Plant */}
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm text-gray-500">Plant</label>
          <select onChange={handlePlantChange} className="px-3 py-2 rounded-lg border">
            <option value="">Select Plant</option>
            {plants.map((plant) => (
              <option key={plant.assetId} value={plant.assetId}>
                {plant.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stack — hidden in compare mode (each row has its own) */}
        {!compareMode && (
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm text-gray-500">Stack</label>
            <select onChange={handleStackChange} className="px-3 py-2 rounded-lg border">
              <option value="">Select Stack</option>
              {stacks.map((stack) => (
                <option key={stack.assetId} value={stack.assetId}>
                  {stack.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Signal — hidden in compare mode */}
        {!compareMode && (
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm text-gray-500">Signals</label>
            <select onChange={handleSignalChange} className="px-3 py-2 rounded-lg border">
              <option value="">Select Signal</option>
              {signals.map((signal) => (
                <option key={signal.mappingId} value={signal.tagName}>
                  {signal.tagName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Time Range */}
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm text-gray-500">Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 rounded-lg border"
          >
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeRange === "custom" && (
            <div className="flex gap-2 mt-1">
              <DatePicker selected={customStart} onChange={setCustomStart} placeholderText="Start" />
              <DatePicker selected={customEnd} onChange={setCustomEnd} placeholderText="End" />
            </div>
          )}
        </div>
      </div>

      {/* ── Compare rows ── */}
      {compareMode && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Select stacks &amp; signal to compare
            </h3>
            <div className="flex gap-3">
              <button
                onClick={addCompareRow}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                + Add Stack
              </button>

              <button
                onClick={getCompareAnalyticsData}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                Fetch
              </button>

              <button onClick={handleClearCompare} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-colors">
                ✕ Clear All
              </button>
            </div>
          </div>

          {compareRows.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
              Click "Add Stack" to start comparing.
            </p>
          )}

          {compareRows.map((row, idx) => (
            <div key={row.id} className="flex flex-wrap items-end gap-4 border rounded-xl p-3 dark:border-gray-700">
              {/* Colour swatch */}
              <div
                className="w-4 h-4 rounded-full mt-6 flex-shrink-0"
                style={{ backgroundColor: row.color }}
              />

              {/* Stack select */}
              <div className="flex flex-1 flex-col gap-1 min-w-[160px]">
                <label className="text-xs text-gray-500">Stack {idx + 1}</label>
                <select
                  value={row.stackId}
                  onChange={(e) => handleCompareStackChange(row.id, Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border text-sm"
                >
                  <option value="">Select Stack</option>
                  {stacks.map((stack) => (
                    <option key={stack.assetId} value={stack.assetId}>
                      {stack.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Signal select */}
              <div className="flex flex-1 flex-col gap-1 min-w-[160px]">
                <label className="text-xs text-gray-500">Signal</label>
                <select
                  value={row.selectedSignal}
                  onChange={(e) => handleCompareSignalChange(row.id, e.target.value)}
                  disabled={row.signals.length === 0}
                  className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
                >
                  <option value="">Select Signal</option>
                  {row.signals.map((signal) => (
                    <option key={signal.mappingId} value={signal.tagName}>
                      {signal.tagName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeCompareRow(row.id)}
                className="mb-0.5 px-2 py-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                title="Remove row"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart ── */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
          {compareMode ? "Signal Comparison" : "Signal Trends"}
        </h3>

        {/* <div className="w-full h-[400px]">
          {compareMode ? (
            isCompareChartLoading ? (
              <ChartLoader />
            ) : compareSeriesList.length > 0 ? (
              <CompareChart seriesList={compareSeriesList} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
                Add stacks and select signals above to compare them here.
              </div>
            )
          ) : chartLoading ? (
            <ChartLoader />
          ) : (
            <SignalChart chartData={chartData} />
          )}
        </div> */}

        <div className="w-full h-[400px]">
          {chartLoading || isCompareChartLoading ? (
            <ChartLoader />
          ) : chartData.length > 0 ? (
            <SignalChart chartData={chartData} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
              Add stacks and select signals above to see chart data here.
            </div>
          )}
        </div>

      </div>

      {/* ── KPI Cards (normal mode only) ── */}
      {!compareMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpiData.map((kpi, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
              <p className="text-sm text-gray-500">{kpi.kpiName.replaceAll("_", " ")}</p>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {kpi.kpiValue.toFixed(2)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Level: {kpi.level}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}