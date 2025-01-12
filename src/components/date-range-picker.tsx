import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  date: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({
  date,
  onChange,
  className,
}: DateRangePickerProps) {
  // Add handler for calendar selection
  const handleSelect = (selectedDate: DateRange | undefined) => {
    // If no date is selected yet, or if we have a complete range, use the new selection
    if (!date || (date.from && date.to)) {
      onChange(selectedDate);
      return;
    }

    // If we're clicking on the existing start date, keep it as anchor and allow selecting in either direction
    if (selectedDate?.from && date.from && 
        selectedDate.from.getTime() === date.from.getTime() && 
        !selectedDate.to) {
      // Keep the existing selection
      return;
    }

    // For all other cases, just pass through the selection
    onChange(selectedDate);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200" 
          align="end"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="bg-white rounded-md"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}