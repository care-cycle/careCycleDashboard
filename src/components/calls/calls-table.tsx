import { useState, useRef, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Flag, GripVertical, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Call } from "@/types/calls";
import { formatPhoneNumber } from "@/lib/utils";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRedaction } from "@/contexts/redaction-context";
import { useNavigate } from "react-router-dom";

interface CallsTableProps {
  calls: Call[];
  onCallSelect: (call: Call) => void;
  showTestCalls: boolean;
  showConnectedOnly: boolean;
  onSort: (key: string, direction: "asc" | "desc" | null) => void;
  sortConfig: {
    key: string;
    direction: "asc" | "desc" | null;
  };
  hasSourceTracking?: boolean;
}

const TestFlask = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-4 w-4"
  >
    <path d="M6 19.5V22H18V19.5L15.5 16H8.5L6 19.5Z" fill="#74E0BB" />
    <path
      d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.453 15h11.094"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 2h7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface SortableHeaderProps {
  header: ColumnKey;
  onSort: () => void;
}

function SortableHeader({ header, onSort }: SortableHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: header });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableHead ref={setNodeRef} style={style}>
      <Button
        variant="ghost"
        onClick={onSort}
        className="hover:text-gray-900 text-gray-600 flex items-center gap-2 px-2 h-10"
      >
        <GripVertical
          className="h-4 w-4 text-muted-foreground cursor-grab"
          {...attributes}
          {...listeners}
        />
        {header}
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </TableHead>
  );
}

// Add this helper function at the top of the file
const redactData = (value: string) => {
  return value.replace(/./g, "*");
};

type ColumnKey =
  | "Caller ID"
  | "Assistant Type"
  | "Direction"
  | "Duration"
  | "Disposition"
  | "Created At"
  | "Source";

export function CallsTable({
  calls,
  onCallSelect,
  showTestCalls,
  showConnectedOnly,
  onSort,
  sortConfig,
  hasSourceTracking = false,
}: CallsTableProps) {
  const { isRedacted } = useRedaction();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio preloading
  const preloadAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
  };

  // Create hidden audio element on mount
  useEffect(() => {
    audioRef.current = new Audio();
  }, []);

  const nonConnectedDispositions = useMemo(
    () => [
      "Busy/No Answer",
      "Voicemail",
      "Telephony Block",
      "Customer Did Not Answer",
      "Pipeline Error",
    ],
    [],
  );

  const filteredCalls = useMemo(() => {
    // Create a Set for faster lookups
    const nonConnectedSet = new Set(nonConnectedDispositions);

    return calls.filter((call) => {
      // Combine conditions to reduce iterations
      return (
        (!showTestCalls ? !call.testFlag : true) &&
        (!showConnectedOnly ? true : !nonConnectedSet.has(call.disposition))
      );
    });
  }, [calls, showTestCalls, showConnectedOnly, nonConnectedDispositions]);

  // Memoize the columns array
  const columns = useMemo<ColumnKey[]>(() => {
    const baseColumns: ColumnKey[] = [
      "Caller ID",
      "Assistant Type",
      "Direction",
      "Duration",
      "Disposition",
      "Created At",
    ];

    // Add Source column if campaign has source tracking
    if (hasSourceTracking) {
      baseColumns.push("Source");
    }

    return baseColumns;
  }, [hasSourceTracking]);

  // Add this mapping object near the top of the component
  const columnToDataKeyMap = useMemo(
    () =>
      ({
        "Caller ID": "callerId",
        "Assistant Type": "assistantType",
        Direction: "direction",
        Duration: "duration",
        Disposition: "disposition",
        "Created At": "createdAt",
        Source: "source",
      }) as const,
    [],
  ); // Use const assertion to preserve literal types

  // Add these sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }

    onSort(key, direction);
  };

  // Add this function to handle customer navigation
  const handleCustomerNavigation = (e: React.MouseEvent, callerId: string) => {
    e.stopPropagation(); // Prevent row selection
    const searchParams = new URLSearchParams();
    // Ensure the phone number starts with a + if it doesn't already
    const formattedNumber = callerId.startsWith("+")
      ? callerId
      : `+${callerId}`;
    searchParams.set("search", formattedNumber);
    navigate(`/customers?${searchParams.toString()}`);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}>
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
                      handleSort(columnToDataKeyMap[header]);
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
                  <div className="h-8 w-8 flex items-center justify-center">
                    <UserSearch
                      className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer"
                      onClick={(e) =>
                        handleCustomerNavigation(e, call.callerId)
                      }
                    />
                  </div>
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {column === "Caller ID" &&
                      (isRedacted
                        ? redactData(call.callerId)
                        : formatPhoneNumber(call.callerId))}
                    {column === "Assistant Type" &&
                      call.assistantType
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    {column === "Direction" &&
                      call.direction.charAt(0).toUpperCase() +
                        call.direction.slice(1)}
                    {column === "Duration" && call.duration}
                    {column === "Disposition" && call.disposition}
                    {column === "Created At" &&
                      format(new Date(call.createdAt), "MMM d, yyyy h:mm a")}
                    {column === "Source" && (
                      <span className="flex items-center justify-center">
                        {call.source || "-"}
                      </span>
                    )}
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
  );
}
