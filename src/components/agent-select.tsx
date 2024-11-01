import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User } from "lucide-react"

interface AgentSelectProps {
  agents: string[]
  value: string
  onValueChange: (value: string) => void
}

export function AgentSelect({ agents, value, onValueChange }: AgentSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <User className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Select agent" />
      </SelectTrigger>
      <SelectContent>
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