import { Input } from "@/components/ui/input"
import { Search, Columns } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react";

interface CustomerFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  availableColumns: { key: string; label: string }[];
  activeColumns: string[];
  onColumnToggle: (columnKey: string) => void;
}

export function CustomerFilters({ 
  searchQuery,
  onSearchChange,
  availableColumns,
  activeColumns,
  onColumnToggle,
}: CustomerFiltersProps) {
  const [open, setOpen] = useState(false);
  const [checkedColumns, setCheckedColumns] = useState<string[]>(activeColumns);

  const handleItemSelect = (event: Event, columnKey: string) => {
    event.preventDefault();
    
    // Update local checked state
    setCheckedColumns(prev => {
      const isChecked = prev.includes(columnKey);
      if (isChecked) {
        return prev.filter(key => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
    
    // Call parent toggle handler
    onColumnToggle(columnKey);
  };

  // Keep checkedColumns in sync with activeColumns from parent
  useEffect(() => {
    setCheckedColumns(activeColumns);
  }, [activeColumns]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between w-full glass-panel p-4 rounded-lg">
        <div className="relative flex-1 max-w-[630px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search customers..."
            className="w-full bg-white/50 pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-4">
              <Columns className="h-4 w-4 mr-2" />
              Manage Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-white border rounded-md shadow-md"
          >
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableColumns
              .filter(column => column.key !== 'callDateTimeUTC' && column.key !== 'Call Date Time U T C')
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={checkedColumns.includes(column.key)}
                  onSelect={(event: any) => handleItemSelect(event, column.key)}
                  className="cursor-pointer"
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 