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

interface BusinessHour {
  dayOfWeek: number[];
  startHour: number;
  endHour: number;
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
    <Card>
      <CardHeader>
        <CardTitle>Regular Business Hours</CardTitle>
        <div className="mt-2 text-sm text-muted-foreground">
          Set your standard operating hours for normal business days. You can:
          <ul className="list-disc pl-6 space-y-1 mt-3">
            <li>
              <span className="font-medium">Multiple Schedules</span> - Create
              different schedules for weekdays, weekends, or specific days
            </li>
            <li>
              <span className="font-medium">Flexible Hours</span> - Set
              different operating hours for different days of the week
            </li>
            <li>
              <span className="font-medium">Time Zone Support</span> - All
              schedules respect your business's configured time zone
            </li>
          </ul>
          <div className="mt-3 italic">
            Note: Regular hours serve as your default schedule but can be
            overridden by special hours and holiday schedules.
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {businessHours.map((schedule, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 border rounded-lg"
          >
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium">Days</label>
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
                  <SelectContent className="glass-panel">
                    <SelectItem value="1,2,3,4,5">
                      Weekdays (Mon-Fri)
                    </SelectItem>
                    <SelectItem value="6,0">Weekends (Sat-Sun)</SelectItem>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Select
                    value={schedule.startHour.toString()}
                    onValueChange={(value) =>
                      handleUpdateSchedule(index, "startHour", Number(value))
                    }
                  >
                    <SelectTrigger className="glass-panel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-panel">
                      {HOURS.map((hour) => (
                        <SelectItem
                          key={hour.value}
                          value={hour.value.toString()}
                        >
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Select
                    value={schedule.endHour.toString()}
                    onValueChange={(value) =>
                      handleUpdateSchedule(index, "endHour", Number(value))
                    }
                  >
                    <SelectTrigger className="glass-panel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-panel">
                      {HOURS.map((hour) => (
                        <SelectItem
                          key={hour.value}
                          value={hour.value.toString()}
                        >
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            Add Schedule
          </Button>

          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}
