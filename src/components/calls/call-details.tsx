import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { X, Flag, User, Clock, PhoneCall, CheckCircle2, ArrowRightLeft, DollarSign } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useUI } from "@/contexts/ui-context"
import { AudioPlayer } from "@/components/audio/audio-player"
import { Call } from '@/types/calls'

interface CallDetailsProps {
  call: Call;
  onClose: () => void;
  preloadedAudio?: HTMLAudioElement;
}

export const CallDetails = memo(function CallDetails({ call, onClose, preloadedAudio }: CallDetailsProps) {
  const [feedback, setFeedback] = useState('')
  const { setCallDetailsOpen } = useUI()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  // Add cleanup effect for audio
  useEffect(() => {
    // Cleanup function that runs when component unmounts OR when call changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [call.id]) // Add dependency on call.id to cleanup when call changes

  // Use callback to prevent recreation of handler
  const handleClose = useCallback(() => {
    setIsClosing(true)
    // Small delay for animation
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      onClose()
    }, 150)
  }, [onClose])

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [handleClose])

  const callDetails = [
    { icon: User, label: "Assistant Type", value: call.assistantType },
    { icon: Clock, label: "Duration", value: call.duration },
    { icon: PhoneCall, label: "Direction", value: call.direction },
    { icon: CheckCircle2, label: "Disposition", value: call.disposition },
    { icon: DollarSign, label: "Cost", value: `$${call.cost.toFixed(3)}` }
  ]

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-150 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      >
        <div className="sticky top-0 z-10 flex w-full border-b bg-background/95 backdrop-blur opacity-40" />
      </div>

      {/* Details Panel */}
      <div className="absolute top-0 bottom-0 right-0 w-[480px] bg-white/95 backdrop-blur-xl shadow-2xl border-l">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Call Details</h2>
              <p className="text-sm text-gray-500">ID: {call.id}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            <AudioPlayer 
              url={call.recordingUrl} 
              className="glass-panel"
              preloadedAudio={preloadedAudio}
              ref={audioRef}
            />

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

            <Accordion type="single" collapsible>
              <AccordionItem value="summary">
                <AccordionTrigger>Call Summary</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600">{call.summary}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="transcript">
                <AccordionTrigger>Transcript</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {call.transcript?.split('\n').map((line, index) => {
                      if (line.startsWith('AI:')) {
                        return <div key={index} className="mb-2"><strong>AI:</strong>{line.substring(3)}</div>
                      }
                      if (line.startsWith('User:')) {
                        return <div key={index} className="mb-2"><strong>User:</strong>{line.substring(5)}</div>
                      }
                      return <div key={index} className="mb-2">{line}</div>
                    }) || 'No transcript available'}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="evaluation">
                <AccordionTrigger>Evaluation</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600">{call.successEvaluation}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
})