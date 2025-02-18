import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InquiryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  isLoading?: boolean;
}

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'pending_resolution', label: 'Pending Resolution' },
  { value: 'unresolved', label: 'Unresolved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'appointment_scheduled', label: 'Appointment Scheduled' }
];

export function InquiryFilters({ 
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLoading = false
}: InquiryFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between w-full glass-panel p-4 rounded-lg">
        <div className="relative flex-1 max-w-[630px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search inquiries..."
            className="w-full bg-white/50 pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[200px] ml-4 bg-white/50">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-md">
            {STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 