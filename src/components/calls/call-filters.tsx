import { useState } from 'react'
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "@/components/date-range-picker"
import { 
  Download, 
  Filter, 
  X,
  Check,
  ChevronDown,
  Search
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

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
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function CallFilters({ dateRange, onDateRangeChange }: CallFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [selectedExports, setSelectedExports] = useState<string[]>([])
  const [openFilter, setOpenFilter] = useState(false)
  const [openExport, setOpenExport] = useState(false)

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
    <div className="flex items-center justify-between gap-4 glass-panel p-4 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search calls..."
            className="w-[300px] bg-white/50 pl-9"
          />
        </div>

        {/* Filters */}
        <Popover open={openFilter} onOpenChange={setOpenFilter}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {selectedFilters.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-1 bg-primary/20 text-primary hover:bg-primary/30"
                >
                  {selectedFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[520px] p-0 bg-white/95 backdrop-blur-xl" 
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search filters..." />
              <CommandList>
                <ScrollArea className="h-[320px]">
                  {Object.entries(filterGroups).map(([group, items], index) => (
                    <div key={group}>
                      {index > 0 && <CommandSeparator />}
                      <CommandGroup heading={group}>
                        {items.map((item) => (
                          <CommandItem
                            key={item.id}
                            onSelect={() => handleFilterSelect(item.id)}
                            className="flex items-center gap-2"
                          >
                            <Checkbox 
                              checked={selectedFilters.includes(item.id)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            {item.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </div>
                  ))}
                </ScrollArea>
              </CommandList>
              <div className="p-2 flex justify-between items-center border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFilters([])}
                >
                  Clear All
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenFilter(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setOpenFilter(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </Command>
          </PopoverContent>
        </Popover>

        <DateRangePicker
          date={dateRange}
          onChange={onDateRangeChange}
        />
      </div>

      {/* Export */}
      <Popover open={openExport} onOpenChange={setOpenExport}>
        <PopoverTrigger asChild>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[520px] p-0 bg-white/95 backdrop-blur-xl" 
          align="end"
        >
          <div className="p-4 border-b">
            <h3 className="font-medium">Export Call Data</h3>
            <p className="text-sm text-gray-500">
              Select the fields you want to include in your export
            </p>
          </div>
          <Command>
            <CommandInput placeholder="Search fields..." />
            <CommandList>
              <ScrollArea className="h-[320px]">
                {Object.entries(filterGroups).map(([group, items], index) => (
                  <div key={group}>
                    {index > 0 && <CommandSeparator />}
                    <CommandGroup heading={group}>
                      {items.map((item) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => handleExportSelect(item.id)}
                          className="flex items-center gap-2"
                        >
                          <Checkbox 
                            checked={selectedExports.includes(item.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          {item.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                ))}
              </ScrollArea>
            </CommandList>
            <div className="p-2 flex justify-between items-center border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedExports([])}
              >
                Clear All
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenExport(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleExport}
                  disabled={selectedExports.length === 0}
                >
                  Export Selected
                </Button>
              </div>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}