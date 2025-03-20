import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import WaveSurfer from "wavesurfer.js";

interface AudioPlayerProps {
  url: string;
  className?: string;
  preloadedAudio?: HTMLAudioElement | null;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  ({ url, className, preloadedAudio }, ref) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const isReadyRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isWaveformReady, setIsWaveformReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Forward the ref
    useImperativeHandle(ref, () => audioRef.current as HTMLAudioElement);

    // Initialize WaveSurfer
    useEffect(() => {
      if (!waveformRef.current || !url) return;

      // Reset states
      setIsLoading(true);
      setIsWaveformReady(false);
      setErrorMessage(null);
      isReadyRef.current = false;

      let isDestroyed = false;

      // Cleanup previous instance first
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (error) {
          console.error("Error destroying WaveSurfer instance:", error);
        }
        wavesurferRef.current = null;
      }

      const initWaveSurfer = async () => {
        try {
          // First validate that the URL is accessible
          const response = await fetch(url, { method: "HEAD" });
          if (!response.ok) {
            throw new Error(
              `Failed to validate audio URL: ${response.statusText}`,
            );
          }

          const wavesurfer = WaveSurfer.create({
            container: waveformRef.current!,
            waveColor: "rgba(116, 224, 187, 0.7)",
            progressColor: "rgba(41, 58, 249, 0.6)",
            cursorColor: "rgba(41, 58, 249, 0.8)",
            cursorWidth: 2,
            barWidth: 2,
            barGap: 0,
            barRadius: 2,
            height: 96,
            barHeight: 1,
            normalize: true,
            backend: "MediaElement",
            mediaControls: false,
            autoplay: false,
            interact: true,
            dragToSeek: true,
          });

          if (isDestroyed) {
            wavesurfer.destroy();
            return;
          }

          wavesurfer.on("ready", () => {
            if (isDestroyed) return;

            isReadyRef.current = true;
            setIsWaveformReady(true);
            setIsLoading(false);
            setDuration(wavesurfer.getDuration());
            setErrorMessage(null);
          });

          wavesurfer.on("error", (error) => {
            console.error("WaveSurfer error:", error);
            setErrorMessage("Error loading audio visualization");
            setIsLoading(false);
          });

          // Store wavesurfer instance
          wavesurferRef.current = wavesurfer;

          // Load the audio
          await wavesurfer.load(url);
        } catch (error) {
          console.error("Error initializing WaveSurfer:", error);
          setErrorMessage("Failed to initialize audio visualization");
          setIsLoading(false);
        }
      };

      // Initialize WaveSurfer with a small delay to ensure cleanup is complete
      setTimeout(() => {
        if (!isDestroyed) {
          initWaveSurfer().catch((error) => {
            console.error("Error in initWaveSurfer:", error);
            setErrorMessage("Failed to initialize audio visualization");
            setIsLoading(false);
          });
        }
      }, 100);

      // Cleanup on unmount or when url changes
      return () => {
        isDestroyed = true;

        if (wavesurferRef.current) {
          try {
            wavesurferRef.current.pause();
            wavesurferRef.current.destroy();
          } catch (error) {
            console.error("Error during WaveSurfer cleanup:", error);
          }
          wavesurferRef.current = null;
        }
      };
    }, [url]);

    // Handle audio element
    useEffect(() => {
      if (!url) return;

      // Create new audio element if not preloaded
      if (preloadedAudio && preloadedAudio.src === url) {
        audioRef.current = preloadedAudio;
      } else {
        const audio = new Audio();

        audio.onerror = (event) => {
          if (event instanceof Event) {
            const target = event.currentTarget as HTMLAudioElement;

            if (target && target.error) {
              switch (target.error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                  setErrorMessage("Audio playback was aborted.");
                  break;
                case MediaError.MEDIA_ERR_NETWORK:
                  setErrorMessage(
                    "A network error occurred while loading the audio.",
                  );
                  break;
                case MediaError.MEDIA_ERR_DECODE:
                  setErrorMessage("The audio could not be decoded.");
                  break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  setErrorMessage("The audio format is not supported.");
                  break;
                default:
                  setErrorMessage("An error occurred while loading the audio.");
              }
            }
          }
        };

        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
          setErrorMessage(null);
        };

        audio.crossOrigin = "anonymous";
        audio.src = url;
        audio.load();
        audioRef.current = audio;
      }

      return () => {
        if (audioRef.current && audioRef.current !== preloadedAudio) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
      };
    }, [url, preloadedAudio]);

    // Sync audio element with wavesurfer
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);

        if (
          wavesurferRef.current &&
          !wavesurferRef.current.isPlaying() &&
          isWaveformReady
        ) {
          try {
            wavesurferRef.current.setTime(audio.currentTime);
          } catch (error) {
            console.error("Error syncing time:", error);
          }
        }
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        if (wavesurferRef.current && isWaveformReady) {
          try {
            setDuration(audio.duration);
          } catch (error) {
            console.error("Error syncing duration:", error);
          }
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        if (wavesurferRef.current && isWaveformReady) {
          try {
            wavesurferRef.current.setTime(0);
          } catch (error) {
            console.error("Error resetting time:", error);
          }
        }
      };

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
      };
    }, [isWaveformReady]);

    const togglePlay = () => {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
        if (wavesurferRef.current && isWaveformReady) {
          try {
            wavesurferRef.current.pause();
          } catch (error) {
            console.error("Error pausing WaveSurfer:", error);
          }
        }
      } else {
        audioRef.current.play();
        if (wavesurferRef.current && isWaveformReady) {
          try {
            wavesurferRef.current.play();
          } catch (error) {
            console.error("Error playing WaveSurfer:", error);
          }
        }
      }

      setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
      if (!audioRef.current) return;

      audioRef.current.muted = !isMuted;
      if (wavesurferRef.current && isWaveformReady) {
        try {
          wavesurferRef.current.setVolume(isMuted ? volume : 0);
        } catch (error) {
          console.error("Error setting WaveSurfer volume:", error);
        }
      }

      setIsMuted(!isMuted);
    };

    const handleSeek = (value: number[]) => {
      if (!audioRef.current) return;

      const newTime = value[0];
      audioRef.current.currentTime = newTime;

      if (wavesurferRef.current && isWaveformReady) {
        try {
          wavesurferRef.current.setTime(newTime);
        } catch (error) {
          console.error("Error seeking in WaveSurfer:", error);
        }
      }

      setCurrentTime(newTime);
    };

    const handleVolumeChange = (value: number[]) => {
      if (!audioRef.current) return;

      const newVolume = value[0];
      audioRef.current.volume = newVolume;

      if (!isMuted && wavesurferRef.current && isWaveformReady) {
        try {
          wavesurferRef.current.setVolume(newVolume);
        } catch (error) {
          console.error("Error setting WaveSurfer volume:", error);
        }
      }

      setVolume(newVolume);
    };

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
      <div className={cn("", className)}>
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          crossOrigin="anonymous"
        />

        {/* Waveform container */}
        <div className="relative rounded-lg overflow-hidden">
          {isLoading && !errorMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {errorMessage && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
              <div className="text-red-500 text-sm text-center px-4">
                {errorMessage}
              </div>
            </div>
          )}

          <div
            ref={waveformRef}
            className="w-full h-[96px]"
            onClick={(e) => {
              if (!isWaveformReady || !wavesurferRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPosition = (e.clientX - rect.left) / rect.width;
              const newTime = clickPosition * duration;
              handleSeek([newTime]);
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={togglePlay}
            disabled={isLoading}
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
              max={duration || 100}
              step={0.01}
              onValueChange={handleSeek}
              disabled={isLoading}
            />
          </div>

          <span className="text-sm text-gray-600 tabular-nums whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleMute}
            disabled={isLoading}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          <div className="w-20">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    );
  },
);

AudioPlayer.displayName = "AudioPlayer";
