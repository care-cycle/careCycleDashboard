import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RegularHoursConfig } from "@/components/operating-hours/regular-hours"
import { SpecialHoursConfig } from "@/components/operating-hours/special-hours"
import { HolidayConfig } from "@/components/operating-hours/holiday-config"

export default function OperatingHoursPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Operating Hours</h1>
      
      <Tabs defaultValue="regular">
        <TabsList>
          <TabsTrigger value="regular">Regular Hours</TabsTrigger>
          <TabsTrigger value="special">Special Hours</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>
        
        <TabsContent value="regular">
          <RegularHoursConfig />
        </TabsContent>
        
        <TabsContent value="special">
          <SpecialHoursConfig />
        </TabsContent>
        
        <TabsContent value="holidays">
          <HolidayConfig />
        </TabsContent>
      </Tabs>
    </div>
  )
}
