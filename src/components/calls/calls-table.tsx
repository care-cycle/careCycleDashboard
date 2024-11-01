import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Play, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const callsData = [
  {
    id: "1",
    agent: "Assistant A",
    direction: "Outbound",
    duration: "1 min 30 sec",
    disposition: "Transferred",
    performance: "9/10",
    endedBy: "Agent"
  },
  {
    id: "2",
    agent: "Assistant B",
    direction: "Inbound",
    duration: "0 min 30 sec",
    disposition: "Unresolved",
    performance: "10/10",
    endedBy: "User"
  },
  {
    id: "3",
    agent: "Assistant C",
    direction: "Outbound",
    duration: "0 min 20 sec",
    disposition: "Voicemail",
    performance: "7/10",
    endedBy: "Agent"
  }
]

interface CallsTableProps {
  onCallSelect: (call: any) => void
}

export function CallsTable({ onCallSelect }: CallsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null)

  const sortedCalls = [...callsData].sort((a, b) => {
    if (!sortConfig) return 0
    const key = sortConfig.key as keyof typeof a
    if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1
    if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const requestSort = (key: string) => {
    setSortConfig({
      key,
      direction: 
        !sortConfig || sortConfig.key !== key
          ? 'asc'
          : sortConfig.direction === 'asc'
          ? 'desc'
          : 'asc',
    })
  }

  return (
    <div className="rounded-md border glass-panel w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            {["Agent", "Direction", "Duration", "Disposition", "Performance", "Ended By"].map((header) => (
              <TableHead key={header}>
                <Button
                  variant="ghost"
                  onClick={() => requestSort(header.toLowerCase())}
                  className="hover:text-gray-900 text-gray-600"
                >
                  {header}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCalls.map((call) => (
            <TableRow
              key={call.id}
              className="hover:bg-black/5 cursor-pointer"
              onClick={() => onCallSelect(call)}
            >
              <TableCell>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Play className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell>{call.agent}</TableCell>
              <TableCell>{call.direction}</TableCell>
              <TableCell>{call.duration}</TableCell>
              <TableCell>{call.disposition}</TableCell>
              <TableCell>{call.performance}</TableCell>
              <TableCell>{call.endedBy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}