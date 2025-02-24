import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useDebounce } from "@/hooks/use-debounce";

interface CallFiltersProps {
  searchQuery: string;
  onSearchChange: (search: string) => void;
  showTestCalls: boolean;
  onTestCallsChange: (show: boolean) => void;
  showConnectedOnly: boolean;
  onConnectedOnlyChange: (show: boolean) => void;
}

export function CallFilters({
  searchQuery,
  onSearchChange,
  showTestCalls,
  onTestCallsChange,
  showConnectedOnly,
  onConnectedOnlyChange,
}: CallFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 250);

  // Update parent's search query when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);

  // Add effect to update local search when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

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
  );
}
