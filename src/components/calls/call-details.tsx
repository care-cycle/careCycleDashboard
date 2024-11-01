import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { X, Play, Flag, User, Clock, PhoneCall, CheckCircle2, ArrowRightLeft, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { useUI } from "@/contexts/ui-context"
import { AudioPlayer } from "@/components/audio/audio-player"

interface CallDetailsProps {
  call: any
  onClose: () => void
}

export function CallDetails({ call, onClose }: CallDetailsProps) {
  const [feedback, setFeedback] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const { setCallDetailsOpen } = useUI()

  const handleClose = () => {
    setCallDetailsOpen(false)
    onClose()
  }

  const callDetails = [
    { icon: User, label: "Agent", value: call.agent },
    { icon: Clock, label: "Duration", value: call.duration },
    { icon: PhoneCall, label: "Direction", value: call.direction },
    { icon: CheckCircle2, label: "Disposition", value: call.disposition },
    { icon: ArrowRightLeft, label: "Ended By", value: call.endedBy },
    { icon: DollarSign, label: "Cost", value: "$5.00" }
  ]

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Details Panel */}
      <div className="absolute top-0 bottom-0 right-0 w-[480px] bg-white/95 backdrop-blur-xl shadow-2xl border-l">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Call Details</h2>
              <p className="text-sm text-gray-500">ID: {call.id}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* Performance Score */}
            <div className="glass-panel p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">Performance Score</div>
              <div className="text-3xl font-bold text-primary">{call.performance}</div>
            </div>

            {/* Call Recording */}
            <AudioPlayer 
              url="https://example.com/recording.mp3" 
              className="glass-panel"
            />

            {/* Call Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {callDetails.map((detail, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <detail.icon className="h-4 w-4 text-gray-500" />
                    <div className="text-sm font-medium text-gray-500">{detail.label}</div>
                  </div>
                  <div className="text-sm font-semibold">{detail.value}</div>
                </Card>
              ))}
            </div>

            {/* Call Details */}
            <Accordion type="single" collapsible>
              <AccordionItem value="summary">
                <AccordionTrigger>Call Summary</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600">
                    Customer called regarding their recent order. Issue was resolved by providing tracking information and estimated delivery date.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="transcript">
                <AccordionTrigger>Transcript</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-gray-600 space-y-4">
                    <p><strong>Agent:</strong> Hello, how can I help you today?</p>
                    <p><strong>Customer:</strong> Hi, I'm calling about my order...</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Feedback Section */}
          <div className="border-t p-4 bg-gray-50/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Call Feedback</h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Flag className="h-4 w-4" />
                  Flag for Review
                </Button>
              </div>
              <Textarea
                placeholder="Add feedback about this call..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="resize-none"
                rows={3}
              />
              <Button className="w-full">Submit Feedback</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}