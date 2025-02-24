import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  url: string;
  className?: string;
  preloadedAudio?: HTMLAudioElement | null;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  ({ url, className, preloadedAudio }, ref) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);

    // Forward the ref
    useImperativeHandle(ref, () => audioRef.current as HTMLAudioElement);

    // Add cleanup effect
    useEffect(() => {
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
        }
      };
    }, []);

    // Handle unmounting cleanup
    useEffect(() => {
      const currentAudio = audioRef.current;

      return () => {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          setIsPlaying(false);
        }
      };
    }, [url]); // Cleanup when URL changes

    useEffect(() => {
      if (preloadedAudio && preloadedAudio.src === url) {
        audioRef.current = preloadedAudio;
      } else {
        audioRef.current = new Audio(url);
        audioRef.current.load();
      }
    }, [url, preloadedAudio]);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => setDuration(audio.duration);
      const handleEnded = () => setIsPlaying(false);

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
      };
    }, []);

    // Draw waveform
    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const centerY = height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Generate smoother waveform data
      const points = 200; // More points for smoother curve
      const segments = 4; // Number of wave segments
      const data = Array.from({ length: points }, (_, i) => {
        const x = (i / points) * width;
        const progress = i / points;

        // Create a smoother, more natural-looking wave
        const baseAmplitude = Math.sin(progress * Math.PI * segments) * 0.3;
        const detail = Math.sin(progress * Math.PI * 12) * 0.1;
        const microDetail = Math.sin(progress * Math.PI * 24) * 0.05;

        // Combine waves and add slight randomness
        const amplitude =
          baseAmplitude + detail + microDetail + Math.random() * 0.1;

        return { x, amplitude: Math.max(-0.8, Math.min(0.8, amplitude)) }; // Clamp values
      });

      // Draw waveform with smoother curves
      ctx.beginPath();
      ctx.strokeStyle = "rgb(14, 165, 233)"; // Sky blue color
      ctx.lineWidth = 1.5; // Slightly thinner line for cleaner look

      // Draw top curve with bezier interpolation
      ctx.moveTo(data[0].x, centerY - data[0].amplitude * height * 0.4);
      for (let i = 1; i < data.length - 2; i++) {
        const xc = (data[i].x + data[i + 1].x) / 2;
        const yc =
          centerY -
          ((data[i].amplitude + data[i + 1].amplitude) / 2) * height * 0.4;
        ctx.quadraticCurveTo(
          data[i].x,
          centerY - data[i].amplitude * height * 0.4,
          xc,
          yc,
        );
      }

      // Draw bottom curve (mirror)
      for (let i = data.length - 1; i >= 1; i--) {
        const xc = (data[i].x + data[i - 1].x) / 2;
        const yc =
          centerY +
          ((data[i].amplitude + data[i - 1].amplitude) / 2) * height * 0.4;
        ctx.quadraticCurveTo(
          data[i].x,
          centerY + data[i].amplitude * height * 0.4,
          xc,
          yc,
        );
      }

      ctx.closePath();

      // Add gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(14, 165, 233, 0.2)");
      gradient.addColorStop(0.5, "rgba(14, 165, 233, 0.1)");
      gradient.addColorStop(1, "rgba(14, 165, 233, 0.2)");
      ctx.fillStyle = gradient;

      ctx.fill();
      ctx.stroke();
    }, []);

    // Draw on mount and window resize
    useEffect(() => {
      drawWaveform();
      const handleResize = () => drawWaveform();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [drawWaveform]);

    const togglePlay = () => {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    };

    const handleSeek = (value: number[]) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    };

    const handleVolumeChange = (value: number[]) => {
      if (!audioRef.current) return;
      const newVolume = value[0];
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    };

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
      <div
        className={cn(
          "bg-white/20 backdrop-blur-xl border border-white/20",
          "rounded-xl p-4 space-y-4 shadow-sm",
          "transition-all duration-200 hover:bg-white/30",
          className,
        )}
      >
        <audio ref={audioRef} src={url} preload="metadata" />

        {/* Waveform Visualization */}
        <div
          className="relative h-24 bg-white/10 rounded-lg overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) {
              const newTime = clickPosition * duration;
              handleSeek([newTime]);
            }
          }}
        >
          {/* Progress overlay */}
          <div
            className="absolute inset-0 bg-sky-500/10"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />

          {/* Waveform canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-white/20"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1">
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          <span className="text-sm text-gray-600 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        </div>
      </div>
    );
  },
);

AudioPlayer.displayName = "AudioPlayer";
