import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useClientData } from "@/hooks/use-client-data";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface SpecialHour {
  type: "special" | "dateRange" | "recurring";
  name: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  recurrence?: "weekly" | "monthly" | "yearly";
  dayOfMonth?: number;
  dayOfWeek?: number[];
  hours: Array<{
    startHour: number;
    endHour: number;
  }>;
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label:
    i === 0
      ? "12:00 AM"
      : i < 12
        ? `${i}:00 AM`
        : i === 12
          ? "12:00 PM"
          : `${i - 12}:00 PM`,
}));

export function SpecialHoursConfig() {
  const { clientInfo, mutate } = useClientData();
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>(
    clientInfo?.specialHours || [],
  );

  const handleAddSchedule = () => {
    setSpecialHours([
      ...specialHours,
      {
        type: "special",
        name: "",
        hours: [
          {
            startHour: 9,
            endHour: 17,
          },
        ],
      },
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    setSpecialHours(specialHours.filter((_, i) => i !== index));
  };

  const handleUpdateSchedule = (
    index: number,
    field: keyof SpecialHour | string,
    value:
      | string
      | number
      | number[]
      | { startHour: number; endHour: number }[]
      | undefined,
  ) => {
    setSpecialHours(
      specialHours.map((schedule, i) => {
        if (i === index) {
          if (field === "hours") {
            return {
              ...schedule,
              hours: value as { startHour: number; endHour: number }[],
            };
          }
          return { ...schedule, [field]: value };
        }
        return schedule;
      }),
    );
  };

  const handleSave = async () => {
    try {
      await mutate({ specialHours });
      toast.success("Special hours updated successfully");
    } catch (error) {
      toast.error("Failed to update special hours");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Special Hours</CardTitle>
        <div className="mt-2 text-sm text-muted-foreground space-y-3">
          <div>
            Special hours allow you to set temporary changes to your business
            hours for specific dates or recurring events. Use this for:
          </div>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">One-time Special Days</span> -
              Single day events like company training or special events
            </li>
            <li>
              <span className="font-medium">Date Ranges</span> - Extended
              periods with different hours, like seasonal changes or temporary
              schedule adjustments
            </li>
            <li>
              <span className="font-medium">Recurring Events</span> - Regular
              schedule changes that happen weekly, monthly, or yearly
            </li>
          </ul>
          <div className="italic">
            Note: Special hours take precedence over regular business hours but
            are overridden by holiday schedules.
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {specialHours.map((schedule, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 border rounded-lg"
          >
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={schedule.type}
                    onValueChange={(value: SpecialHour["type"]) =>
                      handleUpdateSchedule(index, "type", value)
                    }
                  >
                    <SelectTrigger className="glass-panel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-panel">
                      <SelectItem value="special">
                        One-time Special Day
                      </SelectItem>
                      <SelectItem value="dateRange">Date Range</SelectItem>
                      <SelectItem value="recurring">Recurring Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={schedule.name}
                    onChange={(e) =>
                      handleUpdateSchedule(index, "name", e.target.value)
                    }
                    placeholder="e.g., Company Training Day"
                  />
                </div>
              </div>

              {schedule.type === "special" && (
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !schedule.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {schedule.date
                          ? format(new Date(schedule.date), "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 glass-panel"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          schedule.date ? new Date(schedule.date) : undefined
                        }
                        onSelect={(date) =>
                          handleUpdateSchedule(
                            index,
                            "date",
                            date?.toISOString(),
                          )
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {schedule.type === "dateRange" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !schedule.startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {schedule.startDate
                            ? format(new Date(schedule.startDate), "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 glass-panel"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={
                            schedule.startDate
                              ? new Date(schedule.startDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            handleUpdateSchedule(
                              index,
                              "startDate",
                              date?.toISOString(),
                            )
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !schedule.endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {schedule.endDate
                            ? format(new Date(schedule.endDate), "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 glass-panel"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={
                            schedule.endDate
                              ? new Date(schedule.endDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            handleUpdateSchedule(
                              index,
                              "endDate",
                              date?.toISOString(),
                            )
                          }
                          disabled={(date) =>
                            schedule.startDate
                              ? date < new Date(schedule.startDate)
                              : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {schedule.type === "recurring" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Recurrence</label>
                    <Select
                      value={schedule.recurrence}
                      onValueChange={(value) =>
                        handleUpdateSchedule(index, "recurrence", value)
                      }
                    >
                      <SelectTrigger className="glass-panel">
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                      <SelectContent className="glass-panel">
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {schedule.recurrence === "monthly" && (
                    <div>
                      <label className="text-sm font-medium">
                        Day of Month
                      </label>
                      <Select
                        value={schedule.dayOfMonth?.toString()}
                        onValueChange={(value) =>
                          handleUpdateSchedule(
                            index,
                            "dayOfMonth",
                            Number(value),
                          )
                        }
                      >
                        <SelectTrigger className="glass-panel">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent className="glass-panel">
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Hours</label>
                {schedule.hours.map((hour, hourIndex) => (
                  <div key={hourIndex} className="grid grid-cols-2 gap-4 mt-2">
                    <Select
                      value={hour.startHour.toString()}
                      onValueChange={(value) => {
                        const newHours = [...schedule.hours];
                        newHours[hourIndex] = {
                          ...hour,
                          startHour: Number(value),
                        };
                        handleUpdateSchedule(index, "hours", newHours);
                      }}
                    >
                      <SelectTrigger className="glass-panel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-panel">
                        {HOURS.map((h) => (
                          <SelectItem key={h.value} value={h.value.toString()}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={hour.endHour.toString()}
                      onValueChange={(value) => {
                        const newHours = [...schedule.hours];
                        newHours[hourIndex] = {
                          ...hour,
                          endHour: Number(value),
                        };
                        handleUpdateSchedule(index, "hours", newHours);
                      }}
                    >
                      <SelectTrigger className="glass-panel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-panel">
                        {HOURS.map((h) => (
                          <SelectItem key={h.value} value={h.value.toString()}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveSchedule(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleAddSchedule}>
            <Plus className="h-4 w-4 mr-2" />
            Add Special Hours
          </Button>

          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}
