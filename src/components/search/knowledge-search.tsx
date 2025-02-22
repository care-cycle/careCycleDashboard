import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useUI } from "@/contexts/ui-context";
import { format } from "date-fns";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const mockResponses = [
  "Based on your call data, I can see a 23% increase in successful transfers over the past month...",
  "Looking at the performance metrics, Agent B has maintained the highest satisfaction score...",
  "The average call duration has decreased by 45 seconds while maintaining quality scores...",
];

export function KnowledgeSearch() {
  const [isListening, setIsListening] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isCallDetailsOpen } = useUI();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setChatOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleVoice = () => {
    setIsListening(!isListening);
    toast({
      title: isListening ? "Voice input stopped" : "Listening...",
      duration: 2000,
    });
  };

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: value.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setChatOpen(true);
    setQuery("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          mockResponses[Math.floor(Math.random() * mockResponses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSave = () => {
    toast({
      title: "Conversation saved",
      description: "You can access this in your saved queries",
    });
  };

  // Don't render if call details are open
  if (isCallDetailsOpen) return null;

  return (
    <>
      {/* Floating Search Bar */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 w-[600px] h-[44px] z-40",
          "flex items-center gap-2 px-4",
          "glass-panel",
          "rounded-full border border-white/20",
          "transition-all duration-300 ease-in-out",
          isFocused
            ? "bg-white/40 ring-2 ring-primary/50"
            : "hover:bg-white/30",
        )}
      >
        <img
          src="https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/6722f2e1aa50560b1eae60a1_favicon-nodable-knowledge.png"
          alt=""
          className="w-4 h-4"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(query);
            }
          }}
          placeholder="Search call data with Nodable Knowledge... (⌘K)"
          className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-500"
        />
        <button
          onClick={toggleVoice}
          className={cn(
            "p-2 rounded-full transition-colors",
            isListening
              ? "bg-primary/20 text-primary hover:bg-primary/30"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50",
          )}
        >
          {isListening ? (
            <Mic className="w-4 h-4" />
          ) : (
            <MicOff className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
          />
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[800px] max-h-[80vh] min-h-[500px]",
              "glass-panel border border-white/20 rounded-2xl",
              "flex flex-col",
              "animate-in fade-in-0 zoom-in-95 duration-300",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/6722f2e1aa50560b1eae60a1_favicon-nodable-knowledge.png"
                  alt="Nodable Knowledge"
                  className="w-6 h-6"
                />
                <h2 className="text-lg font-semibold text-gray-900">
                  Nodable Knowledge
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4" />
                  Save Query
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2 max-w-[80%] group",
                      message.type === "user" ? "ml-auto" : "mr-auto",
                    )}
                  >
                    <div
                      className={cn(
                        "p-3 rounded-2xl",
                        message.type === "user"
                          ? "bg-primary/10 text-gray-900"
                          : "bg-white/50 text-gray-900",
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {format(message.timestamp, "HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(query);
                    }
                  }}
                  placeholder="Ask anything about your call data..."
                  className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoice}
                  className={cn(
                    "transition-colors",
                    isListening && "text-primary",
                  )}
                >
                  {isListening ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
