import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampaignSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
  campaigns?: Array<{ id: string; name: string }>;
}

export function CampaignSelect({
  value,
  onValueChange,
  isLoading,
  campaigns,
}: CampaignSelectProps) {
  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[240px] glass-panel">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[240px] glass-panel">
        <SelectValue placeholder="Select Campaign" />
      </SelectTrigger>
      <SelectContent className="glass-panel">
        {campaigns?.map((campaign) => (
          <SelectItem key={campaign.id} value={campaign.id}>
            {campaign.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
