import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, ChevronDown } from "lucide-react"
import { useClientData } from "@/hooks/use-client-data"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import apiClient from "@/lib/api-client"

interface Holiday {
  id: string
  name: string
  description?: string
  type: 'fixed' | 'floating' | 'custom'
  month?: number
  dayOfMonth?: number
  floatingRule?: {
    weekOfMonth: number
    dayOfWeek: number
    month: number
  }
  modifiedHours: null | Array<{
    startHour: number
    endHour: number
  }>
}

interface HolidayGroup {
  id: string
  name: string
  description?: string
  holidays: Holiday[]
  enabled?: boolean
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i-12}:00 PM`
}))

export function HolidayConfig() {
  const { clientInfo } = useClientData()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [holidayGroups, setHolidayGroups] = useState<HolidayGroup[]>(
    clientInfo?.holidayGroups || []
  )
  const [isLoading, setIsLoading] = useState(false)
  const [expandedHolidays, setExpandedHolidays] = useState<Set<string>>(new Set());

  // Update holidayGroups when clientInfo changes
  useEffect(() => {
    if (clientInfo?.holidayGroups) {
      setHolidayGroups(clientInfo.holidayGroups)
    }
  }, [clientInfo?.holidayGroups])

  const handleAddGroup = () => {
    const newId = crypto.randomUUID()
    const newGroup: HolidayGroup = {
      id: newId,
      name: "New Holiday Group",
      description: "",
      holidays: []
    }
    setHolidayGroups([...holidayGroups, newGroup])
    setSelectedGroup(newId)
  }

  const handleUpdateGroup = (id: string, field: keyof HolidayGroup, value: any) => {
    setHolidayGroups(groups => groups.map(group => {
      if (group.id === id) {
        return { ...group, [field]: value }
      }
      return group
    }))
  }

  const handleRemoveGroup = (id: string) => {
    setHolidayGroups(groups => groups.filter(group => group.id !== id))
    if (selectedGroup === id) {
      setSelectedGroup(null)
    }
  }

  const handleAddHoliday = (groupId: string) => {
    const newHoliday: Holiday = {
      id: crypto.randomUUID(),
      name: "New Holiday",
      type: "fixed",
      modifiedHours: null
    }

    setHolidayGroups(groups => groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          holidays: [...group.holidays, newHoliday]
        }
      }
      return group
    }))
  }

  const handleUpdateHoliday = (groupId: string, holidayId: string | undefined, field: keyof Holiday | string, value: any) => {
    setHolidayGroups(groups => groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          holidays: group.holidays.map(holiday => {
            if (holiday.id === holidayId) {
              if (field === 'floatingRule') {
                return {
                  ...holiday,
                  floatingRule: { ...(holiday.floatingRule || {}), ...value }
                }
              }
              return { ...holiday, [field]: value }
            }
            return holiday
          })
        }
      }
      return group
    }))
  }

  const handleRemoveHoliday = (groupId: string, holidayId: string | undefined) => {
    setHolidayGroups(groups => groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          holidays: group.holidays.filter(holiday => holiday.id !== holidayId)
        }
      }
      return group
    }))
  }

  const handleSave = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true)
    try {
      const formattedGroups = holidayGroups.map(group => ({
        id: group.id,
        name: group.name || '',
        description: group.description || '',
        enabled: typeof group.enabled === 'boolean' ? group.enabled : true,
        holidays: (group.holidays || []).map(holiday => ({
          id: holiday.id,
          name: holiday.name || '',
          description: holiday.description || '',
          type: holiday.type || 'fixed',
          month: holiday.month || null,
          dayOfMonth: holiday.dayOfMonth || null,
          floatingRule: holiday.floatingRule ? {
            weekOfMonth: holiday.floatingRule.weekOfMonth || 1,
            dayOfWeek: holiday.floatingRule.dayOfWeek || 1,
            month: holiday.floatingRule.month || 1
          } : null,
          modifiedHours: holiday.modifiedHours || null
        }))
      }))

      await apiClient.put('/portal/client/holiday-groups', { holidayGroups: formattedGroups })
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [holidayGroups, isLoading])

  const selectedGroupData = holidayGroups.find(g => g.id === selectedGroup)

  const toggleHolidayExpanded = (holidayId: string) => {
    setExpandedHolidays(current => {
      const newSet = new Set(current);
      if (newSet.has(holidayId)) {
        newSet.delete(holidayId);
      } else {
        newSet.add(holidayId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            Loading holiday configuration...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holiday Groups</CardTitle>
        <CardDescription className="mt-2">
          Holiday groups help you manage different sets of holidays and their operating hours. They're useful for:
        </CardDescription>
        <div className="mt-4 space-y-3">
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li><span className="font-medium">Multiple Holiday Sets</span> - Create different groups for federal holidays, company holidays, or regional observances</li>
            <li><span className="font-medium">Flexible Scheduling</span> - Set holidays as fixed dates (e.g., Dec 25), floating dates (e.g., 3rd Monday of January), or custom dates</li>
            <li><span className="font-medium">Holiday Hours</span> - Specify if you're closed or operating with modified hours during holidays</li>
          </ul>
          <div className="text-sm text-muted-foreground italic">
            Note: Holiday schedules have the highest priority and will override both regular business hours and special hours.
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-[320px_1fr] gap-8">
          <div className="space-y-3">
            {holidayGroups.map(group => (
              <div
                key={group.id}
                className={`p-4 rounded-lg cursor-pointer border transition-colors ${
                  selectedGroup === group.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted/50 border-transparent"
                }`}
                onClick={() => setSelectedGroup(group.id)}
              >
                <div className="font-medium">{group.name}</div>
                {group.description && (
                  <div className="text-sm mt-1 opacity-80">{group.description}</div>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleAddGroup}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          </div>

          {selectedGroupData && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <Input
                    value={selectedGroupData.name}
                    onChange={(e) => handleUpdateGroup(selectedGroupData.id, 'name', e.target.value)}
                    className="text-xl font-semibold h-10 px-3"
                    placeholder="Group Name"
                  />
                  <Input
                    value={selectedGroupData.description || ''}
                    onChange={(e) => handleUpdateGroup(selectedGroupData.id, 'description', e.target.value)}
                    placeholder="Add a description..."
                    className="text-muted-foreground"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-4"
                  onClick={() => handleRemoveGroup(selectedGroupData.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {selectedGroupData.holidays.map(holiday => (
                  <Collapsible
                    key={holiday.id}
                    open={expandedHolidays.has(holiday.id)}
                    onOpenChange={() => toggleHolidayExpanded(holiday.id)}
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0">
                            <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${
                              expandedHolidays.has(holiday.id) ? 'rotate-180' : ''
                            }`} />
                          </Button>
                        </CollapsibleTrigger>
                        <div className="font-medium">{holiday.name}</div>
                        {holiday.type === 'fixed' && holiday.month && holiday.dayOfMonth && (
                          <div className="text-sm text-muted-foreground">
                            {MONTHS.find(m => m.value === holiday.month)?.label} {holiday.dayOfMonth}
                          </div>
                        )}
                        {holiday.type === 'floating' && holiday.floatingRule?.weekOfMonth && holiday.floatingRule?.dayOfWeek && holiday.floatingRule?.month && (
                          <div className="text-sm text-muted-foreground">
                            {['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Last'][holiday.floatingRule.weekOfMonth === -1 ? 5 : holiday.floatingRule.weekOfMonth - 1]} {' '}
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][holiday.floatingRule.dayOfWeek]} {' '}
                            of {MONTHS.find(m => m.value === holiday.floatingRule.month)?.label}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-4"
                        onClick={() => handleRemoveHoliday(selectedGroupData.id, holiday.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Holiday Name</Label>
                            <Input
                              value={holiday.name}
                              onChange={(e) => handleUpdateHoliday(
                                selectedGroupData.id,
                                holiday.id,
                                'name',
                                e.target.value
                              )}
                              placeholder="e.g., Christmas Day"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Holiday Type</Label>
                            <Select
                              value={holiday.type}
                              onValueChange={(value: Holiday['type']) => handleUpdateHoliday(
                                selectedGroupData.id,
                                holiday.id,
                                'type',
                                value
                              )}
                            >
                              <SelectTrigger className="glass-panel">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass-panel">
                                <SelectItem value="fixed">Fixed Date</SelectItem>
                                <SelectItem value="floating">Floating Date</SelectItem>
                                <SelectItem value="custom">Custom Date</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {holiday.type === 'fixed' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Month</Label>
                              <Select
                                value={holiday.month?.toString()}
                                onValueChange={(value) => handleUpdateHoliday(
                                  selectedGroupData.id,
                                  holiday.id,
                                  'month',
                                  Number(value)
                                )}
                              >
                                <SelectTrigger className="glass-panel">
                                  <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel">
                                  {MONTHS.map((month) => (
                                    <SelectItem key={month.value} value={month.value.toString()}>
                                      {month.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Day</Label>
                              <Select
                                value={holiday.dayOfMonth?.toString()}
                                onValueChange={(value) => handleUpdateHoliday(
                                  selectedGroupData.id,
                                  holiday.id,
                                  'dayOfMonth',
                                  Number(value)
                                )}
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
                          </div>
                        )}

                        {holiday.type === 'floating' && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Week</Label>
                              <Select
                                value={holiday.floatingRule?.weekOfMonth?.toString()}
                                onValueChange={(value) => handleUpdateHoliday(
                                  selectedGroupData.id,
                                  holiday.id,
                                  'floatingRule',
                                  {
                                    ...holiday.floatingRule,
                                    weekOfMonth: Number(value)
                                  }
                                )}
                              >
                                <SelectTrigger className="glass-panel">
                                  <SelectValue placeholder="Week of month" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel">
                                  <SelectItem value="1">First</SelectItem>
                                  <SelectItem value="2">Second</SelectItem>
                                  <SelectItem value="3">Third</SelectItem>
                                  <SelectItem value="4">Fourth</SelectItem>
                                  <SelectItem value="5">Fifth</SelectItem>
                                  <SelectItem value="-1">Last</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Day</Label>
                              <Select
                                value={holiday.floatingRule?.dayOfWeek?.toString()}
                                onValueChange={(value) => handleUpdateHoliday(
                                  selectedGroupData.id,
                                  holiday.id,
                                  'floatingRule',
                                  {
                                    ...holiday.floatingRule,
                                    dayOfWeek: Number(value)
                                  }
                                )}
                              >
                                <SelectTrigger className="glass-panel">
                                  <SelectValue placeholder="Day of week" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel">
                                  <SelectItem value="0">Sunday</SelectItem>
                                  <SelectItem value="1">Monday</SelectItem>
                                  <SelectItem value="2">Tuesday</SelectItem>
                                  <SelectItem value="3">Wednesday</SelectItem>
                                  <SelectItem value="4">Thursday</SelectItem>
                                  <SelectItem value="5">Friday</SelectItem>
                                  <SelectItem value="6">Saturday</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Month</Label>
                              <Select
                                value={holiday.floatingRule?.month?.toString()}
                                onValueChange={(value) => handleUpdateHoliday(
                                  selectedGroupData.id,
                                  holiday.id,
                                  'floatingRule',
                                  {
                                    ...holiday.floatingRule,
                                    month: Number(value)
                                  }
                                )}
                              >
                                <SelectTrigger className="glass-panel">
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel">
                                  {MONTHS.map((month) => (
                                    <SelectItem key={month.value} value={month.value.toString()}>
                                      {month.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4 pt-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={holiday.modifiedHours !== null}
                              onCheckedChange={(checked) => 
                                handleUpdateHoliday(
                                  selectedGroupData.id,
                                  holiday.id,
                                  'modifiedHours',
                                  checked ? [{ startHour: 9, endHour: 17 }] : null
                                )
                              }
                            />
                            <Label>Modified Hours</Label>
                          </div>

                          {holiday.modifiedHours && holiday.modifiedHours[0] && (
                            <div className="grid grid-cols-2 gap-4 pl-8">
                              <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Select
                                  value={holiday.modifiedHours[0].startHour.toString()}
                                  onValueChange={(value) => {
                                    if (holiday.modifiedHours && holiday.modifiedHours[0]) {
                                      handleUpdateHoliday(
                                        selectedGroupData.id,
                                        holiday.id,
                                        'modifiedHours',
                                        [{ 
                                          ...holiday.modifiedHours[0],
                                          startHour: Number(value)
                                        }]
                                      )
                                    }
                                  }}
                                >
                                  <SelectTrigger className="glass-panel">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="glass-panel">
                                    {HOURS.map((hour) => (
                                      <SelectItem key={hour.value} value={hour.value.toString()}>
                                        {hour.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>End Time</Label>
                                <Select
                                  value={holiday.modifiedHours[0].endHour.toString()}
                                  onValueChange={(value) => {
                                    if (holiday.modifiedHours && holiday.modifiedHours[0]) {
                                      handleUpdateHoliday(
                                        selectedGroupData.id,
                                        holiday.id,
                                        'modifiedHours',
                                        [{
                                          ...holiday.modifiedHours[0],
                                          endHour: Number(value)
                                        }]
                                      )
                                    }
                                  }}
                                >
                                  <SelectTrigger className="glass-panel">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="glass-panel">
                                    {HOURS.map((hour) => (
                                      <SelectItem key={hour.value} value={hour.value.toString()}>
                                        {hour.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleAddHoliday(selectedGroupData.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Holiday
                  </Button>

                  <Button onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 