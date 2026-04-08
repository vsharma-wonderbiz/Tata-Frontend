import React, { useState, useEffect } from "react";
import { GetAllPlantKpis, GetAllStackKpis, type AlertResponse, type PlantKpis, type StackKpis } from "../api/assetApi";
import { GetPlantKpiData,GetStackKpiData,GetLatestAlerts,type PlantKpiAnalyticsResult,type stackKpiAnalyticsResult } from "../api/analyticsApi";
import KpiBarChart from "../components/ui/Kpibarchart";
import { ScatterChart } from "@/components/ui/ScatterChart";
import {DataTable} from "@/components/ui/DataTable";


interface PlantKpiPayload {
  KpiId: number;
  KpiName: string;
  NoOfWeeks: number;
}



function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const [Alert,setAlerts] = useState<AlertResponse[]>([])
  const [plantKpis, setPlantKpis] = useState<PlantKpis[]>([]);
  const [StackKpis, setStackKpis] = useState<StackKpis[]>([]);  
  const [selectPlantKpi, setSelectedPlantKpi] = useState<PlantKpis>();
  const [selectStackKpi, setSelectedStackKpi] = useState<StackKpis>();
  const [analyticsData, setAnalyticsData] = useState<PlantKpiAnalyticsResult | null>(null);
  const [stackData, setStackData] = useState<stackKpiAnalyticsResult | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const kpis = await GetAllPlantKpis();
        const stacklevelKpis=await GetAllStackKpis();
        const alerts=await GetLatestAlerts();
        setPlantKpis(kpis);
        setStackKpis(stacklevelKpis); 
        setAlerts(alerts)
      } catch (error) {
        console.error("Error fetching KPIs:", error);
      }
    };
    fetchKpis();
  }, []);

  console.log(Alert)

  //to fetch the kpi data when the kpi is been selected in the dropdwon
const fetchPlantKpiAnalytics = async (kpi: PlantKpis) => {
    const payload: PlantKpiPayload = {
      KpiId: kpi.tagId as number,
      KpiName: kpi.tagName as string,
      NoOfWeeks: 2,
    };

    setLoadingAnalytics(true);
    setAnalyticsData(null);

    try {
      const response = await GetPlantKpiData(payload);
      // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log("Plant KPI Analytics Response:", response);
      setAnalyticsData(response);
    } catch (error) {
      console.error("Error fetching Plant KPI analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };


  const handlePlantKpiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKpiId = e.target.value;
    const selected = plantKpis.find(k => k.tagId?.toString() === selectedKpiId);
    setSelectedPlantKpi(selected);
    setAnalyticsData(null);
    if (selected) fetchPlantKpiAnalytics(selected);
  };

  const handleStackKpiChange  =(e:React.ChangeEvent<HTMLSelectElement>)=>{
       const selectedKpiId = e.target.value;
       const selected = StackKpis.find(k => k.tagId?.toString() === selectedKpiId);
       setSelectedStackKpi(selected);
      
       setStackData(null);
       if(selected) fetchStackKpiAnalytics(selected);
  };

const fetchStackKpiAnalytics = async (kpi: StackKpis) => {
  const Payload = {
    KpiId: kpi.tagId as number,        
    KpiName: kpi.tagName as string,   
    NoOfStack: 3,
    NoOfWeeks: 3,
  };

  setLoadingAnalytics(true);
  setStackData(null);

  try {
    const response = await GetStackKpiData(Payload);
    console.log("Stack KPI Analytics Response:", response);
    setStackData(response);           
  } catch (error) {
    console.error("Error fetching Stack KPI analytics:", error);
  } finally {
    setLoadingAnalytics(false);
  }
};


  const chartData = [
    ...(analyticsData?.weeklyData.map((w) => ({
      kpiName: `Week ${w.weekNumber}`,
      kpiValue: w.value,
      level: "plant",
    })) ?? []),
    ...(analyticsData?.hourlyData.map((h) => ({
      kpiName: `LastHour`,
      kpiValue: h.value,
      level: "plant",
    })) ?? []),
  ];



  const kpiLabel = analyticsData?.kpiName.replaceAll("_", " ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">
          Real-time monitoring of manufacturing assets and devices
        </p>
      </div>

      <div className="flex flex-row gap-6">
        {/* ── Plant Level Insight card ── */}
        <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
          <div className="flex flex-col gap-3">
            <label className="text-sm text-gray-500">Plant Level Insight</label>

            <select
              onChange={handlePlantKpiChange}
              className="px-3 py-2 rounded-lg border"
            >
              <option value="">Select KPI</option>
              {plantKpis.map((kpi) => (
                <option key={kpi.tagId?.toString()} value={kpi.tagId?.toString()}>
                  {kpi.tagName}
                </option>
              ))}
            </select>

            {/* Loading state */}
            {loadingAnalytics && (
              <div className="flex items-center justify-center h-[300px] text-sm text-gray-400">
                Loading…
              </div>
            )}

            {/* Empty state */}
            {!loadingAnalytics && !analyticsData && (
              <div className="flex items-center justify-center h-[300px] text-sm text-gray-400">
                Select a KPI to view the chart
              </div>
            )}

            {/* Data loaded — single chart with all bars */}
            {!loadingAnalytics && analyticsData && chartData.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1 capitalize">
                  {kpiLabel} — last {analyticsData.noOfWeeks} weeks + last hour
                </p>
                <KpiBarChart data={chartData} color="#3b82f6" height={300} />
              </div>
            )}
            
          </div>
        </div>


       
        <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
          <div className="flex flex-col gap-3">
            <label className="text-sm text-gray-500">Stack Level Insight</label>

            <select
              onChange={handleStackKpiChange}
              className="px-3 py-2 rounded-lg border"
            >
            <option value="">Select KPI</option>
              {StackKpis.map((kpi) => (
                <option key={kpi.tagId?.toString()} value={kpi.tagId?.toString()}>
                  {kpi.tagName}
                </option>
              ))}
               
            </select>


            {/* loader */}
             {loadingAnalytics && (
              <div className="flex items-center justify-center h-[300px] text-sm text-gray-400">
                Loading…
              </div>
            )}

            {!loadingAnalytics && stackData  && (
              <div>
             <ScatterChart data={stackData}/>
              </div>
            )}

           
          </div>
        </div>

      </div>

     <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
        <label className="text-sm text-gray-500">Recent Alerts</label>
        <DataTable AlertsData={Alert}/>
     </div>

    </div>
  );
}