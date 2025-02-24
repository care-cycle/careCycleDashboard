import { useState, useMemo, forwardRef, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Phone,
  Mail,
  MapPin,
  ArrowUpDown,
  PhoneForwarded,
  GripVertical,
  MessageSquareOff,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Customer } from "@/types/customers"; // You might need to create this types file
import { formatPhoneNumber, formatDate } from "@/lib/utils";
import { CampaignBadge } from "./campaign-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRedaction } from "@/hooks/use-redaction";
import { useNavigate } from "react-router-dom";

interface SortableHeaderProps {
  header: { key: string; label: string };
  onSort: () => void;
}

function SortableHeader({ header, onSort }: SortableHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: header.key });

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
        {header.label}
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </TableHead>
  );
}

interface CustomersTableProps {
  customers: Customer[];
  dataFields?: string[];
  onCustomerSelect?: (customer: Customer) => void;
  onSort: (key: string, direction: "asc" | "desc" | null) => void;
  sortConfig: {
    key: string;
    direction: "asc" | "desc" | null;
  };
  activeColumnKeys: string[];
  onColumnToggle: (columnKey: string) => void;
}
export interface TableRef {
  availableColumns: { key: string; label: string }[];
}

export const CustomersTable = forwardRef<TableRef, CustomersTableProps>(
  (
    {
      customers,
      dataFields = [],
      onCustomerSelect,
      onSort,
      sortConfig,
      activeColumnKeys,
    }: CustomersTableProps,
    ref,
  ) => {
    const { isRedacted } = useRedaction();
    const navigate = useNavigate();

    const renderCustomerName = useCallback(
      (firstName: string, lastName?: string) => {
        return `${firstName} ${isRedacted && lastName ? "*".repeat(lastName.length) : lastName || ""}`;
      },
      [isRedacted],
    );

    const renderCustomerId = useCallback(
      (id?: string) => {
        return `ID: ${isRedacted && id ? "*".repeat(id.length) : id || ""}`;
      },
      [isRedacted],
    );

    const renderContact = useCallback(
      (value?: string) => {
        if (!value) return "";
        if (isRedacted) return "*".repeat(value.length);

        if (value.replace(/\D/g, "").length >= 10) {
          return formatPhoneNumber(value);
        }
        return value;
      },
      [isRedacted],
    );

    // Combine all columns in one useMemo
    const allColumns = useMemo(() => {
      // Start with default columns
      const columns = [
        {
          key: "customer",
          label: "Customer",
          render: (customer: Customer) => (
            <span className="flex flex-col">
              <span className="font-medium">
                {renderCustomerName(customer.firstName, customer.lastName)}
              </span>
              <span className="text-sm text-gray-500">
                {renderCustomerId(customer.id)}
              </span>
            </span>
          ),
        },
        {
          key: "contact",
          label: "Contact",
          render: (customer: Customer) => (
            <span className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{renderContact(customer.callerId) || "-"}</span>
              </span>
              {customer.email && (
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{renderContact(customer.email)}</span>
                </span>
              )}
            </span>
          ),
        },
        {
          key: "location",
          label: "Location",
          render: (customer: Customer) => (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>
                {[customer.state, customer.timezone, customer.postalCode]
                  .filter((value) => value && value !== "null" && value !== "")
                  .join(", ") || "-"}
              </span>
            </span>
          ),
        },
        {
          key: "campaigns",
          label: "Active Campaigns",
          render: (customer: Customer) => (
            <div className="flex flex-wrap gap-2">
              {customer.campaigns?.length
                ? customer.campaigns.map((campaign) => (
                    <CampaignBadge
                      key={campaign.campaign_id}
                      name={campaign.campaign_name}
                      status={campaign.campaign_status}
                    />
                  ))
                : "-"}
            </div>
          ),
        },
        {
          key: "calls",
          label: "Total Calls",
          render: (customer: Customer) => (
            <div className="text-center w-full">{customer.totalCalls || 0}</div>
          ),
        },
        {
          key: "last-contact",
          label: "Last Contact",
          render: (customer: Customer) =>
            customer.lastCallDate ? formatDate(customer.lastCallDate) : "-",
        },
      ];

      // Add data field columns
      dataFields.forEach((field: string) => {
        columns.push({
          key: `data_${field}`,
          label: field
            .replace(/([A-Z])/g, " $1")
            .split(/(?=[A-Z])/)
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ")
            .replace(/\b(Id|Sf)\b/gi, (match: string) => match.toUpperCase()),
          render: (customer: Customer) => {
            const value =
              customer.customData?.[field] ?? customer[field as keyof Customer];
            if (
              value === null ||
              value === undefined ||
              value === "null" ||
              value === ""
            )
              return "-";
            if (typeof value === "boolean") return value ? "Yes" : "No";
            if (typeof value === "object") {
              const stringified = JSON.stringify(value);
              return stringified === "null" ? "-" : stringified;
            }
            return String(value) === "null" ? "-" : String(value);
          },
        });
      });

      return columns;
    }, [dataFields, renderCustomerName, renderCustomerId, renderContact]);

    // State for ordered columns
    const [orderedColumns, setOrderedColumns] = useState(() =>
      activeColumnKeys
        .map((key) => allColumns.find((col) => col.key === key))
        .filter((col): col is (typeof allColumns)[0] => col !== undefined),
    );

    // Expose availableColumns through ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref({ availableColumns: allColumns });
        } else {
          ref.current = { availableColumns: allColumns };
        }
      }
    }, [ref, allColumns]);

    // Update ordered columns when activeColumnKeys changes
    useEffect(() => {
      setOrderedColumns(
        activeColumnKeys
          .map((key) => allColumns.find((col) => col.key === key))
          .filter((col): col is (typeof allColumns)[0] => col !== undefined),
      );
    }, [activeColumnKeys, allColumns]);

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

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor),
    );

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id && over?.id) {
        setOrderedColumns((items) => {
          const oldIndex = items.findIndex((col) => col.key === active.id);
          const newIndex = items.findIndex((col) => col.key === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    };

    // Add this function to handle calls navigation
    const handleCallsNavigation = (
      e: React.MouseEvent,
      callerId: string | undefined,
    ) => {
      e.stopPropagation(); // Prevent row selection
      if (!callerId) return;

      // Format the phone number to ensure it starts with +
      const formattedNumber = callerId.startsWith("+")
        ? callerId
        : `+${callerId}`;

      const searchParams = new URLSearchParams();
      searchParams.set("search", formattedNumber);
      navigate(`/calls?${searchParams.toString()}`);
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
                <TableHead className="w-12" />
                <SortableContext
                  items={orderedColumns.map((col) => col.key)}
                  strategy={horizontalListSortingStrategy}
                >
                  {orderedColumns.map((column) => (
                    <SortableHeader
                      key={column.key}
                      header={column}
                      onSort={() => handleSort(column.key)}
                    />
                  ))}
                </SortableContext>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <TableRow
                    key={`row-${customer.id}`}
                    className="hover:bg-black/5 cursor-pointer"
                    onClick={() => onCustomerSelect?.(customer)}
                  >
                    <TableCell>
                      <div className="h-8 w-8 flex items-center justify-center">
                        <PhoneForwarded
                          className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer"
                          onClick={(e) =>
                            handleCallsNavigation(e, customer.callerId)
                          }
                        />
                      </div>
                    </TableCell>
                    {orderedColumns.map((column) => (
                      <TableCell key={`cell-${customer.id}-${column.key}`}>
                        {column.render(customer)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!customer.smsConsent && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center w-6 h-6">
                                  <MessageSquareOff className="h-4 w-4 text-red-500" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="left"
                                className="flex items-center"
                              >
                                <p className="text-sm whitespace-nowrap">
                                  No SMS Consent
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {customer.doNotContact && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center w-6 h-6">
                                  <PhoneOff className="h-4 w-4 text-red-500" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="left"
                                className="flex items-center"
                              >
                                <p className="text-sm whitespace-nowrap">
                                  Do Not Contact
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={orderedColumns.length + 2}
                    className="text-center py-4"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DndContext>
    );
  },
);
