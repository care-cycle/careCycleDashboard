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
  onError?: () => void;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  ({ url, className, preloadedAudio, onError }, ref) => {
    const instanceId = useRef(
      Math.random().toString(36).substring(2, 8),
    ).current; // Unique ID for logging
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
          setErrorMessage("Error loading audio visualization");
          setIsLoading(false);
        }
        wavesurferRef.current = null;
      }

      const initWaveSurfer = async (retryCount = 0) => {
        const maxRetries = 2; // Allow 2 retries (total 3 attempts)
        const retryDelay = 500; // Wait 500ms between retries

        try {
          // Use GET for validation as HEAD might not be allowed by CORS/S3 policies on the pre-signed URL itself
          const controller = new AbortController();
          const signal = controller.signal;
          const validationTimeout = setTimeout(() => controller.abort(), 5000);

          console.log(`Attempt ${retryCount + 1}: Validating URL: ${url}`);
          const response = await fetch(url, { method: "GET", signal });
          clearTimeout(validationTimeout);

          if (!response.ok) {
            const errorMsg =
              response.status === 403
                ? `Failed to validate audio URL: ${response.statusText} (Forbidden - possible temporary issue)`
                : `Failed to validate audio URL: ${response.statusText}`;
            throw new Error(errorMsg);
          }
          console.log(`Attempt ${retryCount + 1}: URL Validation successful.`);

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

          wavesurfer.on("ready", () => {
            if (isDestroyed) return;
            console.log(`Attempt ${retryCount + 1}: WaveSurfer ready.`);
            isReadyRef.current = true;
            setIsWaveformReady(true);
            setIsLoading(false);
            setDuration(wavesurfer.getDuration());
            setErrorMessage(null);
          });

          wavesurfer.on("error", (error) => {
            console.error(
              `Attempt ${retryCount + 1}: WaveSurfer error:`,
              error,
            );
            // Treat wavesurfer error as a trigger for retry as well
            throw new Error("WaveSurfer initialization error");
          });

          wavesurferRef.current = wavesurfer;

          console.log(
            `Attempt ${retryCount + 1}: Loading audio into WaveSurfer...`,
          );
          await wavesurfer.load(url);
          console.log(`Attempt ${retryCount + 1}: WaveSurfer load initiated.`);
        } catch (error: any) {
          console.error(`Attempt ${retryCount + 1} failed:`, error.message);
          if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay}ms...`);
            setTimeout(() => {
              if (!isDestroyed) {
                initWaveSurfer(retryCount + 1); // Recursive call for retry
              }
            }, retryDelay);
          } else {
            console.error(
              "Max retries reached. Failed to initialize audio visualization.",
            );
            setErrorMessage(
              "Failed to initialize audio visualization after multiple attempts.",
            );
            setIsLoading(false);
            onError?.(); // Call the error callback
          }
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
              onError?.(); // Call the error callback
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
        const audio = audioRef.current;
        if (audio && audio !== preloadedAudio) {
          audio.pause();
          audio.src = "";
        }
      };
    }, [url, preloadedAudio]);

    // Sync audio element state with wavesurfer and UI
    useEffect(() => {
      const wavesurfer = wavesurferRef.current;
      const audio = audioRef.current;

      if (!wavesurfer || !audio || !isWaveformReady) return;

      // Use WaveSurfer's event for time updates
      const handleWsAudioprocess = (time: number) => {
        setCurrentTime(time);
      };

      // Keep listening to the audio element for metadata and end events
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      const handleEnded = () => {
        setIsPlaying(false);
        // No need to manually setTime(0) on wavesurfer here,
        // as playing again will start from 0 or user can seek.
      };

      wavesurfer.on("audioprocess", handleWsAudioprocess);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);

      return () => {
        // Important: Use wavesurfer.un() to remove listeners
        wavesurfer.un("audioprocess", handleWsAudioprocess);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
      };
      // Depend on isWaveformReady to ensure wavesurfer is initialized
    }, [isWaveformReady]);

    const togglePlay = () => {
      // Only use wavesurfer to control playback
      if (wavesurferRef.current && isWaveformReady) {
        wavesurferRef.current.playPause();
        setIsPlaying(!isPlaying); // Update our state based on the action we took
      }
    };

    const toggleMute = () => {
      if (!wavesurferRef.current || !isWaveformReady) return;

      const newMuted = !isMuted;
      try {
        // Set volume to 0 if muted, otherwise restore previous volume
        wavesurferRef.current.setVolume(newMuted ? 0 : volume);
        setIsMuted(newMuted);
      } catch (error) {
        console.error(
          "Error setting WaveSurfer volume for mute/unmute:",
          error,
        );
      }
    };

    const handleSeek = (value: number[]) => {
      const newTime = value[0];
      // Seek using wavesurfer's seekTo, which expects progress (0-1)
      if (wavesurferRef.current && isWaveformReady && duration > 0) {
        const progress = newTime / duration;
        try {
          wavesurferRef.current.seekTo(progress);
          setCurrentTime(newTime); // Update local state immediately for responsiveness
        } catch (error) {
          console.error("Error seeking in WaveSurfer:", error);
        }
      } else if (audioRef.current) {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    const handleVolumeChange = (value: number[]) => {
      const newVolume = value[0];
      setVolume(newVolume);

      // Only set volume via wavesurfer if not muted
      if (!isMuted && wavesurferRef.current && isWaveformReady) {
        try {
          wavesurferRef.current.setVolume(newVolume);
        } catch (error) {
          console.error("Error setting WaveSurfer volume:", error);
        }
      }
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
