import { useState } from "react";
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

interface BusinessHour {
  dayOfWeek: number[];
  startHour: number;
  endHour: number;
  startMinute?: number;
  endMinute?: number;
  timezone: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const formatHour = (hour: number) => {
  if (hour === 0) return "12";
  if (hour > 12) return String(hour - 12);
  return String(hour);
};

const getAmPm = (hour: number) => (hour >= 12 ? "PM" : "AM");

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${formatHour(i)}:00 ${getAmPm(i)}`,
}));

const MINUTES = [
  { value: 0, label: "00" },
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
];

export function RegularHoursConfig() {
  const { clientInfo, mutate } = useClientData();
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(
    clientInfo?.businessHours || [],
  );

  const handleAddSchedule = () => {
    setBusinessHours([
      ...businessHours,
      {
        dayOfWeek: [],
        startHour: 9,
        endHour: 17,
        startMinute: 0,
        endMinute: 0,
        timezone: "America/New_York",
      },
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    setBusinessHours(businessHours.filter((_, i) => i !== index));
  };

  const handleUpdateSchedule = (
    index: number,
    field: keyof BusinessHour,
    value: number | number[] | string,
  ) => {
    setBusinessHours(
      businessHours.map((schedule, i) => {
        if (i === index) {
          return { ...schedule, [field]: value };
        }
        return schedule;
      }),
    );
  };

  const handleSave = async () => {
    try {
      await mutate({ businessHours });
      toast.success("Business hours updated successfully");
    } catch (error) {
      toast.error("Failed to update business hours");
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-lg bg-white p-4">
        <h2 className="text-lg font-semibold">Regular Business Hours</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set your standard operating hours for normal business days. You can:
        </p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li>
            • Multiple Schedules - Create different schedules for weekdays,
            weekends, or specific days
          </li>
          <li>
            • Flexible Hours - Set different operating hours for different days
            of the week
          </li>
          <li>
            • Time Zone Support - All schedules respect your business's
            configured time zone
          </li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2 italic">
          Note: Regular hours serve as your default schedule but can be
          overridden by special hours and holiday schedules.
        </p>
      </div>

      <div className="space-y-4">
        {businessHours.map((schedule, index) => (
          <div key={index} className="rounded-lg border bg-card p-4 relative">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Day(s)</label>
                <Select
                  value={schedule.dayOfWeek.join(",")}
                  onValueChange={(value) =>
                    handleUpdateSchedule(
                      index,
                      "dayOfWeek",
                      value.split(",").map(Number),
                    )
                  }
                >
                  <SelectTrigger className="glass-panel">
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md">
                    <SelectItem
                      value="1,2,3,4,5"
                      className="hover:bg-[#10B981] hover:text-white"
                    >
                      Weekdays (Mon-Fri)
                    </SelectItem>
                    <SelectItem
                      value="6,0"
                      className="hover:bg-[#10B981] hover:text-white"
                    >
                      Weekends (Sat-Sun)
                    </SelectItem>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem
                        key={day.value}
                        value={day.value.toString()}
                        className="hover:bg-[#10B981] hover:text-white"
                      >
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Start Time
                  </label>
                  <div className="flex items-center">
                    <Select
                      value={schedule.startHour.toString()}
                      onValueChange={(value) =>
                        handleUpdateSchedule(index, "startHour", Number(value))
                      }
                    >
                      <SelectTrigger className="w-[140px] glass-panel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-md">
                        {HOURS.map((hour) => (
                          <SelectItem
                            key={hour.value}
                            value={hour.value.toString()}
                            className="hover:bg-[#10B981] hover:text-white"
                          >
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="mx-2">:</span>
                    <Select
                      value={schedule.startMinute?.toString() || "0"}
                      onValueChange={(value) =>
                        handleUpdateSchedule(
                          index,
                          "startMinute",
                          Number(value),
                        )
                      }
                    >
                      <SelectTrigger className="w-[70px] glass-panel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-md">
                        {MINUTES.map((minute) => (
                          <SelectItem
                            key={minute.value}
                            value={minute.value.toString()}
                            className="hover:bg-[#10B981] hover:text-white"
                          >
                            {minute.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    End Time
                  </label>
                  <div className="flex items-center">
                    <Select
                      value={schedule.endHour.toString()}
                      onValueChange={(value) =>
                        handleUpdateSchedule(index, "endHour", Number(value))
                      }
                    >
                      <SelectTrigger className="w-[140px] glass-panel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-md">
                        {HOURS.map((hour) => (
                          <SelectItem
                            key={hour.value}
                            value={hour.value.toString()}
                            className="hover:bg-[#10B981] hover:text-white"
                          >
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="mx-2">:</span>
                    <Select
                      value={schedule.endMinute?.toString() || "0"}
                      onValueChange={(value) =>
                        handleUpdateSchedule(index, "endMinute", Number(value))
                      }
                    >
                      <SelectTrigger className="w-[70px] glass-panel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-md">
                        {MINUTES.map((minute) => (
                          <SelectItem
                            key={minute.value}
                            value={minute.value.toString()}
                            className="hover:bg-[#10B981] hover:text-white"
                          >
                            {minute.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveSchedule(index)}
              className="absolute right-4 top-4"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleAddSchedule} className="h-9">
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
        <Button onClick={handleSave} className="bg-[#10B981] text-white h-9">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
