import { useState, useEffect } from 'react'
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "@/components/date-range-picker"
import { 
  Download, 
  Filter, 
  Search
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { useDebounce } from "@/hooks/use-debounce"

const filterGroups = {
  "Key Metrics": [
    { id: "total-dials", label: "Total Dials" },
    { id: "unique-customers", label: "Unique Customers" },
    { id: "connected-calls", label: "Connected Calls" },
    { id: "unanswered", label: "Unanswered" }
  ],
  "Duration": [
    { id: "duration", label: "Duration" }
  ],
  "Performance": [
    { id: "performance-score", label: "Performance Score" },
    { id: "qa-score", label: "QA Score" }
  ],
  "Transfers": [
    { id: "total-transfers", label: "Total Transfers" },
    { id: "transfer-rate", label: "Transfer Rate" }
  ],
  "Agent Analysis": [
    { id: "agent-calls", label: "Calls by Agent" },
    { id: "agent-transfers", label: "Transfers by Agent" }
  ],
  "Call Details": [
    { id: "agent-name", label: "Agent Name" },
    { id: "direction", label: "Direction" },
    { id: "cost", label: "Cost" },
    { id: "phone", label: "Phone/Extension" },
    { id: "from-number", label: "From Number" },
    { id: "summary", label: "Call Summary" },
    { id: "transcript", label: "Transcript" }
  ]
}

interface CallFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showTestCalls: boolean;
  onTestCallsChange: (value: boolean) => void;
  showConnectedOnly: boolean;
  onConnectedOnlyChange: (value: boolean) => void;
}

export function CallFilters({ 
  searchQuery,
  onSearchChange,
  showTestCalls,
  onTestCallsChange,
  showConnectedOnly,
  onConnectedOnlyChange,
}: CallFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [selectedExports, setSelectedExports] = useState<string[]>([])
  const [openFilter, setOpenFilter] = useState(false)
  const [openExport, setOpenExport] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 500);

  // Update parent's search query when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilters(current => 
      current.includes(filterId) 
        ? current.filter(id => id !== filterId)
        : [...current, filterId]
    )
  }

  const handleExportSelect = (fieldId: string) => {
    setSelectedExports(current => 
      current.includes(fieldId) 
        ? current.filter(id => id !== fieldId)
        : [...current, fieldId]
    )
  }

  const handleExport = () => {
    // Export logic here
    setOpenExport(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between w-full glass-panel p-4 rounded-lg">
        <div className="relative flex-1 max-w-[630px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search calls..."
            className="w-full bg-white/50 pl-9"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="connected-calls"
                checked={showConnectedOnly}
                onCheckedChange={onConnectedOnlyChange}
              />
              <label
                htmlFor="connected-calls"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show Connected Calls Only
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="test-calls"
                checked={showTestCalls}
                onCheckedChange={onTestCallsChange}
              />
              <label
                htmlFor="test-calls"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show Test Calls
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}