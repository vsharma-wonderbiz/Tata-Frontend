import axios from "axios";
import { data } from "react-router-dom";

export interface AnalyticsPayload {
  AssetName: string;
  TagName: string;
  StartTime: string;
  EndTime: string;
}

export interface DataPoint {
  timeStamp: string;
  value: number;
}

export interface AnalyticsResponse {
  asseName: string; 
  tagName: string;  
  values: DataPoint[];
}

export interface KPIItem {
  kpiName: string;
  kpiValue: number;
  level: string;
}

export interface KPIResponse {
  stackName: string;
  week: number;
  data: KPIItem[];
}

interface WeeklyDataItem {
  weekNumber: number;
  startTime: string;
  endTime: string;
  value: number;
}

interface HourlyDataItem {
  startTime: string;
  endTime: string;
  value: number;
}

export interface PlantKpiAnalyticsResult {
  kpiName: string;
  noOfWeeks: number;
  weeklyData: WeeklyDataItem[];
  hourlyData: HourlyDataItem[];
}

interface stackKpiVlaues{
  startTime:string,
  endpoint:string,
  assetname:string,
  weekNumber:number
  value:number
} 

export interface stackKpiAnalyticsResult{
  kpiName:string,
  noOfStacks:number,
  noOfWeeks:number,
  values:stackKpiVlaues[]
}

export interface AlertResponse{
  id:number,
  mappingId:number,
  signalName:string,
  value:number,
  alarmType:string,
  status:string,
  createdAt:string,
  resolvedAt:string,
  "mapping":number
}


const api = axios.create({
  baseURL: "https://localhost:7144/api",
  headers: {
    "Content-Type": "application/json"
  }
});

export const getAnalyticsData = async (
  payload: AnalyticsPayload
): Promise<AnalyticsResponse> => {
  try {
    console.log(payload)
    const res = await api.post<AnalyticsResponse>(
      "/Analytics/data",
      payload
    );
    // console.log(res)
    return res.data;
  } catch (error) {
    console.error("Analytics API Error:", error);
    throw error;
  }
};

export const getKpisByStack = async (
  stackName: string
): Promise<KPIResponse> => {
  try {
    const res = await api.get<KPIResponse>(
      `/Analytics/latest/${stackName}`
    );

    return res.data;
  } catch (error) {
    console.error("KPI API Error:", error);
    throw error;
  }
};

export const GetPlantKpiData = async (
  payload: any
): Promise<PlantKpiAnalyticsResult> => {
  try {
    const res = await api.post<PlantKpiAnalyticsResult>(
      "/Analytics/PlantKpis",
      payload  
    );

    return res.data;
  } catch (error) {
    console.error("Analytics API Error:", error);
    throw error;
  }
};


export const GetStackKpiData = async (
  payload: any
): Promise<stackKpiAnalyticsResult> => {
  try {
    const res = await api.post<stackKpiAnalyticsResult>(
      "/Analytics/StackKpis",
      payload  
    );

    return res.data;
  } catch (error) {

    console.error("Analytics API Error:", error);
    throw error;
  }
};


export const GetLatestAlerts = async (): Promise<AlertResponse[]> => {
  try{
    const res = await api.get<AlertResponse[]>("/Analytics/Alerts")
    return res.data;
  }catch(error){
    console.error("Alerts Api Error:", error);
    throw error;
  }
}