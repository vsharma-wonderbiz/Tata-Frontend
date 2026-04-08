import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AlertResponse } from "@/api/assetApi"
import { formatIsoTimestamp } from "@/utils/time";


export function DataTable({ AlertsData }: { AlertsData: AlertResponse[] }) {
  return (
    <Table>
      <TableCaption>Recent Alerts</TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>Signal Name</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Alarm Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Triggered At</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {AlertsData?.map((e) => (
          <TableRow key={e.id}>
            <TableCell>{e.signalName}</TableCell>
            <TableCell>{e.value}</TableCell>
            <TableCell>{e.alarmType}</TableCell>
            <TableCell>
              <div
                className={
                  e.status === "Resolved"
                    ? "bg-green-300 text-green-800 px-2 py-1 rounded"
                    : e.status === "active"
                      ? "bg-red-100 text-red-800 px-2 py-1 rounded"
                      : "bg-gray-100 text-gray-800 px-2 py-1 rounded"
                }
              >
                {e.status}
              </div>
            </TableCell>

            <TableCell>{formatIsoTimestamp(e.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}