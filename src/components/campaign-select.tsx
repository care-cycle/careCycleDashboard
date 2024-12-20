import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useInitialData } from "@/hooks/useInitialData"

interface CampaignSelectProps {
  value: string
  onValueChange: (value: string) => void
}

export function CampaignSelect({ value, onValueChange }: CampaignSelectProps) {
  const { clientInfo } = useInitialData();
  const campaigns = clientInfo?.campaigns || [];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[240px] glass-panel">
        <SelectValue placeholder="All Campaigns" />
      </SelectTrigger>
      <SelectContent className="glass-panel">
        <SelectItem value="all">All Campaigns</SelectItem>
        {campaigns.map((campaign) => (
          <SelectItem 
            key={campaign.name} 
            value={campaign.name}
            disabled={!campaign.enabled}
          >
            {campaign.name}
            {!campaign.enabled && " (Disabled)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 