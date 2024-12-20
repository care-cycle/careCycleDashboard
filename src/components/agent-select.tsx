import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AgentSelectProps {
  agents: string[]
  value: string
  onValueChange: (value: string) => void
}

export function AgentSelect({ agents, value, onValueChange }: AgentSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px] glass-panel">
        <SelectValue placeholder="All Agents" />
      </SelectTrigger>
      <SelectContent className="glass-panel">
        <SelectItem value="all">All Agents</SelectItem>
        {agents.map((agent) => (
          <SelectItem key={agent} value={agent}>
            {agent}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}