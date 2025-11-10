import { KPICard } from "@/components/dashboard/KPICard";
import { Building2, Cpu, Network, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of manufacturing assets and devices
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Departments"
            value="2"
            icon={<Building2 className="h-8 w-8" />}
            trend="+2 this month"
            trendUp
          />
          <KPICard
            title="Active Devices"
            value="247"
            icon={<Cpu className="h-8 w-8" />}
            trend="98.4% uptime"
            trendUp
          />
          <KPICard
            title="Total Assets"
            value="1,543"
            icon={<Network className="h-8 w-8" />}
            trend="+12 this week"
            trendUp
          />
          <KPICard
            title="Alerts Today"
            value="8"
            icon={<AlertTriangle className="h-8 w-8" />}
            trend="-3 from yesterday"
            trendUp={false}
          />
        </div>
      </div>
  );
}
