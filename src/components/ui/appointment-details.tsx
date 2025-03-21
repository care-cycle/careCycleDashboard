import * as React from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Appointment } from "@/hooks/use-client-data";

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
}

export const MemoizedAppointmentDetails = React.memo(
  function AppointmentDetails({
    appointment,
    onClose,
  }: AppointmentDetailsProps) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Appointment Details</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Name</span>
              <span className="col-span-3">
                {appointment.firstName} {appointment.lastName}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Phone</span>
              <span className="col-span-3">{appointment.callerId}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Campaign</span>
              <span className="col-span-3">{appointment.campaignName}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Date</span>
              <span className="col-span-3">
                {format(new Date(appointment.appointmentDateTime), "PPP")}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Time</span>
              <span className="col-span-3">
                {format(new Date(appointment.appointmentDateTime), "p")}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Status</span>
              <span
                className={cn(
                  "col-span-3",
                  appointment.appointmentAttended
                    ? "text-green-600"
                    : "text-red-600",
                )}
              >
                {appointment.appointmentAttended ? "Attended" : "Not Attended"}
              </span>
            </div>
            {appointment.state && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">State</span>
                <span className="col-span-3">{appointment.state}</span>
              </div>
            )}
            {appointment.postalCode && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Postal Code</span>
                <span className="col-span-3">{appointment.postalCode}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);
