import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { PhoneForwarded } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

interface Source {
  sourceId: string
  name: string
  total_calls: number
  billable_calls: number
  billable_percentage: number
  spend: number
  new_transfers: number
  new_calls: number
  new_transfer_percentage: number
  appointment_transfers: number
  appointment_calls: number
  appointment_transfer_percentage: number
  total_transfers: number
  total_transfer_percentage: number
  billable_transfers: number
  billable_transfer_rate: number
  converted_calls: number
  transfer_conversion_rate: number
  cost_per_acquisition: number
}

interface SourcesTableProps {
  sources: Source[]
}

function MetricCell({ 
  numerator, 
  denominator, 
  percentage 
}: { 
  numerator: number, 
  denominator: number, 
  percentage: number 
}) {
  return (
    <div className="space-y-1">
      <div className="text-right">
        <span className="font-medium">{numerator.toLocaleString()}</span>
        <span className="text-muted-foreground">/{denominator.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Progress value={percentage} className="w-[60px]" />
        <span className="text-sm text-muted-foreground w-[36px] text-right">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export function SourcesTable({ sources: initialSources }: SourcesTableProps) {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });

  const columns = [
    { key: 'name', label: 'Source Name' },
    { key: 'spend', label: 'Spend' },
    { key: 'billable_calls', label: 'Billable Calls' },
    { key: 'new_transfers', label: 'Transfers from 1st Call' },
    { key: 'appointment_transfers', label: 'Transfers from Appt.' },
    { key: 'total_transfers', label: 'Total Transfers' },
    { key: 'billable_transfer_rate', label: 'Billable→Transfer' },
    { key: 'transfer_conversion_rate', label: 'Transfer→Converted' },
    { key: 'cost_per_acquisition', label: 'Cost/Acquisition' }
  ];

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };

  const handleCallsNavigation = (e: React.MouseEvent, source: Source) => {
    e.stopPropagation();
    const searchParams = new URLSearchParams();
    searchParams.set('search', source.name || source.sourceId);
    navigate(`/calls?${searchParams.toString()}`);
  };

  const sortedSources = [...initialSources].sort((a, b) => {
    if (!sortConfig.direction || !sortConfig.key) return 0;

    const getValue = (source: Source, key: string) => {
      switch (key) {
        case 'name':
          return source.name || source.sourceId;
        case 'billable_calls':
          return source.billable_calls;
        case 'spend':
          return source.spend;
        case 'new_transfers':
          return source.new_transfer_percentage;
        case 'appointment_transfers':
          return source.appointment_transfer_percentage;
        case 'total_transfers':
          return source.total_transfer_percentage;
        case 'billable_transfer_rate':
          return source.billable_transfer_rate;
        case 'transfer_conversion_rate':
          return source.transfer_conversion_rate;
        case 'cost_per_acquisition':
          return source.cost_per_acquisition;
        default:
          return 0;
      }
    };

    const aValue = getValue(a, sortConfig.key);
    const bValue = getValue(b, sortConfig.key);

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  return (
    <div className="rounded-md border glass-panel w-full relative">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`text-sm text-muted-foreground cursor-pointer hover:text-foreground ${
                  column.key === 'name' ? 'text-center' : 'text-right'
                }`}
                onClick={() => handleSort(column.key)}
              >
                {column.label} ↑↓
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="relative">
          <div className="absolute top-0 bottom-0 right-0 border-l border-white/30 flex items-center justify-center z-10"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(16px)',
              width: 'calc(250% / 12)',  // Increased from 200% to 250% to better cover the columns
            }}
          >
            <span className="text-sm font-bold text-gray-600 whitespace-nowrap">Activate Welcome Calls to unlock</span>
          </div>
          {sortedSources.map((source) => (
            <TableRow key={source.sourceId} className="hover:bg-muted/30">
              <TableCell>
                <div className="h-8 w-8 flex items-center justify-center">
                  <PhoneForwarded 
                    className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" 
                    onClick={(e) => handleCallsNavigation(e, source)}
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium text-center">
                {source.name || source.sourceId}
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1">
                  <div className="text-right text-sm">
                    <span className="text-muted-foreground">Per Transfer: </span>
                    <span className="font-medium">
                      {source.total_transfers > 0 
                        ? formatCurrency(source.spend / source.total_transfers) 
                        : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium">{formatCurrency(source.spend)}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <MetricCell 
                  numerator={source.billable_calls}
                  denominator={source.total_calls}
                  percentage={source.billable_percentage}
                />
              </TableCell>
              <TableCell className="text-right">
                <MetricCell 
                  numerator={source.appointment_transfers}
                  denominator={source.appointment_calls}
                  percentage={source.appointment_transfer_percentage}
                />
              </TableCell>
              <TableCell className="text-right">
                <MetricCell 
                  numerator={source.total_transfers}
                  denominator={source.total_calls}
                  percentage={source.total_transfer_percentage}
                />
              </TableCell>
              <TableCell className="text-right border-l">
                <MetricCell 
                  numerator={source.billable_transfers}
                  denominator={source.billable_calls}
                  percentage={source.billable_transfer_rate}
                />
              </TableCell>
              <TableCell className="text-right">
                <MetricCell 
                  numerator={source.converted_calls}
                  denominator={source.total_transfers}
                  percentage={source.transfer_conversion_rate}
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(source.cost_per_acquisition)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 