import ReactECharts from "echarts-for-react";
import { Scale } from "lucide-react";

export function ScatterChart({ data, height = 300 }: any) {
  
console.log(data)
const values=data.values.map((e :any )=>e.value);
console.log(values)
const min = Math.min(...values);
const max = Math.max(...values);
 

  if (!data?.values) return <div>No data</div>;

  const stacks = [
    ...new Set(data.values.map((d: any) => d.assetname as string)),
  ] as string[];

  const weeks = [
    ...new Set(data.values.map((d: any) => d.weekNumber as number)),
  ] as number[];

  const series = weeks.map((week: number) => {
    const weekData = data.values.filter((d: any) => d.weekNumber === week);

    const formattedData = stacks.map((stack: string, index: number) => {
      const point = weekData.find((d: any) => d.assetname === stack);
      return [index, point ? point.value : null];
    });

    return {
      name: `Week ${week}`,
      type: "scatter",
      data: formattedData,
    };
  });


  const option = {
    xAxis: {
      type: "category",
      name: "Stacks",
      data: stacks,
    },
    yAxis: {
      type: "value",
      name: "KPI Value",
      min:min.toFixed(2),
      max:max.toFixed(2),
      Scale:true
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      data: weeks.map((w: number) => `Week ${w}`),
    },
    series: series,
  };

  console.log(option    )

  return (
    <div>

      <ReactECharts option={option} style={{ height }} />
    </div>
  );
}