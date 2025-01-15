import { useState, useRef, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Play, ArrowUpDown, Flag, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Call } from '@/types/calls'
import { formatPhoneNumber } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CallsTableProps {
  onCallSelect: (call: Call) => void
  calls: Call[]
  showTestCalls: boolean
  showConnectedOnly: boolean
}

const TestFlask = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
    <path d="M6 19.5V22H18V19.5L15.5 16H8.5L6 19.5Z" fill="#74E0BB"/>
    <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.453 15h11.094" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 2h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface SortableHeaderProps {
  header: string;
  onSort: () => void;
}

function SortableHeader({ header, onSort }: SortableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: header });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableHead ref={setNodeRef} style={style}>
      <div className="flex items-center h-10">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab flex items-center p-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Sort Button */}
        <Button
          variant="ghost"
          onClick={onSort}
          className="hover:text-gray-900 text-gray-600 flex items-center gap-2 px-2 h-10"
        >
          {header}
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>
    </TableHead>
  );
}

export function CallsTable({ calls, onCallSelect, showTestCalls, showConnectedOnly }: CallsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null)

  // Audio preloading
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  const preloadAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url
      audioRef.current.load()
    }
  }

  // Create hidden audio element on mount
  useEffect(() => {
    audioRef.current = new Audio()
  }, [])

  const sortedCalls = [...calls].sort((a, b) => {
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

  const nonConnectedDispositions = [
    'Busy/No Answer',
    'Voicemail',
    'Telephony Block',
    'Customer Did Not Answer',
    'Pipeline Error'
  ];

  const filteredCalls = sortedCalls.filter(call => {
    // Filter out test calls if showTestCalls is false
    if (!showTestCalls && call.testFlag) {
      return false;
    }
    
    // Filter out non-connected calls if showConnectedOnly is true
    if (showConnectedOnly && nonConnectedDispositions.includes(call.disposition)) {
      return false;
    }
    
    return true;
  });

  // Add this new state for columns
  const [columns, setColumns] = useState([
    "Caller ID",
    "Assistant Type",
    "Direction",
    "Duration",
    "Disposition",
    "Created At"
  ]);

  // Add these sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Add this handler for drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Add this mapping object near the top of the component
  const columnToDataKeyMap: { [key: string]: keyof Call } = {
    "Caller ID": "callerId",
    "Assistant Type": "assistantType",
    "Direction": "direction",
    "Duration": "duration",
    "Disposition": "disposition",
    "Created At": "createdAt"
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="rounded-md border glass-panel w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <SortableContext 
                items={columns} 
                strategy={horizontalListSortingStrategy}
              >
                {columns.map((header) => (
                  <SortableHeader
                    key={header}
                    header={header}
                    onSort={() => {
                      // Use the mapping to get the correct data key
                      requestSort(columnToDataKeyMap[header]);
                    }}
                  />
                ))}
              </SortableContext>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCalls.map((call) => (
              <TableRow
                key={call.id}
                className="hover:bg-black/5 cursor-pointer"
                onClick={() => onCallSelect(call)}
                onMouseEnter={() => preloadAudio(call.recordingUrl)}
              >
                <TableCell>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Play className="h-4 w-4" />
                  </Button>
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {column === "Caller ID" && formatPhoneNumber(call.callerId)}
                    {column === "Assistant Type" && call.assistantType}
                    {column === "Direction" && call.direction}
                    {column === "Duration" && call.duration}
                    {column === "Disposition" && call.disposition}
                    {column === "Created At" && format(new Date(call.createdAt), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                ))}
                <TableCell>
                  {call.testFlag && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <TestFlask />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Test Call</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DndContext>
  )
}