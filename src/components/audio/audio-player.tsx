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
  // Stereo visualization properties
  isStereo?: boolean;
  stereoUrl?: string; // URL for stereo recording (used for visualization only)
  leftChannelLabel?: string; // e.g., "AI Assistant"
  rightChannelLabel?: string; // e.g., "Customer"
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  (
    {
      url,
      className,
      preloadedAudio,
      onError,
      isStereo,
      stereoUrl,
      leftChannelLabel,
      rightChannelLabel,
    },
    ref,
  ) => {
    const instanceId = useRef(
      Math.random().toString(36).substring(2, 8),
    ).current; // Unique ID for logging
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const stereoAudioRef = useRef<HTMLAudioElement | null>(null); // For stereo analysis only
    const waveformRef = useRef<HTMLDivElement>(null);
    const leftChannelRef = useRef<HTMLDivElement>(null);
    const rightChannelRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const leftWavesurferRef = useRef<WaveSurfer | null>(null);
    const rightWavesurferRef = useRef<WaveSurfer | null>(null);
    const isReadyRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isWaveformReady, setIsWaveformReady] = useState(false);
    const [isStereoReady, setIsStereoReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [speakerActivity, setSpeakerActivity] = useState<
      "left" | "right" | "both" | "none"
    >("none");

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
      let currentController: AbortController | null = null;

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

        // Check if component was destroyed before starting
        if (isDestroyed) {
          console.log(
            `Component destroyed, skipping initialization attempt ${retryCount + 1}`,
          );
          return;
        }

        try {
          // Create a new controller for this specific attempt
          currentController = new AbortController();
          const signal = currentController.signal;

          // Set a reasonable timeout for the fetch request
          const validationTimeout = setTimeout(() => {
            if (currentController && !signal.aborted) {
              currentController.abort();
            }
          }, 10000); // Increased to 10 seconds for better reliability

          console.log(`Attempt ${retryCount + 1}: Validating URL: ${url}`);

          // Check if destroyed before making the request
          if (isDestroyed) {
            clearTimeout(validationTimeout);
            return;
          }

          const response = await fetch(url, {
            method: "HEAD", // Use HEAD first for faster validation
            signal,
            headers: {
              Range: "bytes=0-0", // Minimal range request to check accessibility
            },
          });

          clearTimeout(validationTimeout);

          // Check if destroyed after the request
          if (isDestroyed) {
            return;
          }

          if (!response.ok) {
            const errorMsg =
              response.status === 403
                ? `Failed to validate audio URL: ${response.statusText} (Forbidden - possible temporary issue)`
                : `Failed to validate audio URL: ${response.statusText}`;
            throw new Error(errorMsg);
          }
          console.log(`Attempt ${retryCount + 1}: URL Validation successful.`);

          // Check if destroyed before creating WaveSurfer
          if (isDestroyed) {
            return;
          }

          // Create main waveform (for mono playback)
          const wavesurfer = WaveSurfer.create({
            container: waveformRef.current!,
            waveColor: isStereo
              ? "rgba(156, 163, 175, 0.4)"
              : "rgba(116, 224, 187, 0.7)",
            progressColor: "rgba(41, 58, 249, 0.6)",
            cursorColor: "rgba(41, 58, 249, 0.8)",
            cursorWidth: 2,
            barWidth: 2,
            barGap: 0,
            barRadius: 2,
            height: isStereo ? 48 : 96,
            barHeight: 1,
            normalize: true,
            backend: "MediaElement",
            mediaControls: false,
            autoplay: false,
            interact: true,
            dragToSeek: true,
          });

          // Create stereo channel visualizations if stereo URL is provided
          if (
            isStereo &&
            stereoUrl &&
            leftChannelRef.current &&
            rightChannelRef.current
          ) {
            const leftWavesurfer = WaveSurfer.create({
              container: leftChannelRef.current,
              waveColor: "rgba(34, 197, 94, 0.7)", // Green for left channel
              progressColor: "rgba(34, 197, 94, 0.9)",
              cursorColor: "rgba(41, 58, 249, 0.8)",
              cursorWidth: 2,
              barWidth: 2,
              barGap: 0,
              barRadius: 2,
              height: 64,
              barHeight: 1,
              normalize: true,
              backend: "MediaElement",
              mediaControls: false,
              autoplay: false,
              interact: false, // Disable interaction on channel views
              splitChannels: [
                {
                  waveColor: "rgba(34, 197, 94, 0.7)",
                  progressColor: "rgba(34, 197, 94, 0.9)",
                },
              ],
            });

            const rightWavesurfer = WaveSurfer.create({
              container: rightChannelRef.current,
              waveColor: "rgba(239, 68, 68, 0.7)", // Red for right channel
              progressColor: "rgba(239, 68, 68, 0.9)",
              cursorColor: "rgba(41, 58, 249, 0.8)",
              cursorWidth: 2,
              barWidth: 2,
              barGap: 0,
              barRadius: 2,
              height: 64,
              barHeight: 1,
              normalize: true,
              backend: "MediaElement",
              mediaControls: false,
              autoplay: false,
              interact: false,
              splitChannels: [
                {},
                {
                  waveColor: "rgba(239, 68, 68, 0.7)",
                  progressColor: "rgba(239, 68, 68, 0.9)",
                },
              ],
            });

            leftWavesurferRef.current = leftWavesurfer;
            rightWavesurferRef.current = rightWavesurfer;
          }

          wavesurfer.on("ready", () => {
            if (isDestroyed) return;
            console.log(`Attempt ${retryCount + 1}: WaveSurfer ready.`);

            // Load stereo waveforms if available
            if (
              isStereo &&
              stereoUrl &&
              leftWavesurferRef.current &&
              rightWavesurferRef.current
            ) {
              Promise.all([
                leftWavesurferRef.current.load(stereoUrl),
                rightWavesurferRef.current.load(stereoUrl),
              ])
                .then(() => {
                  if (isDestroyed) return;
                  setIsStereoReady(true);
                  console.log(`Stereo waveforms ready for visualization`);
                })
                .catch((error) => {
                  console.warn("Failed to load stereo visualization:", error);
                  // Continue with mono-only mode
                  setIsStereoReady(false);
                });
            }

            isReadyRef.current = true;
            setIsWaveformReady(true);
            setIsLoading(false);
            setDuration(wavesurfer.getDuration());
            setErrorMessage(null);
          });

          wavesurfer.on("error", (error) => {
            if (isDestroyed) return;
            console.error(
              `Attempt ${retryCount + 1}: WaveSurfer error:`,
              error,
            );
            // Treat wavesurfer error as a trigger for retry as well
            throw new Error("WaveSurfer initialization error");
          });

          // Check if destroyed before assigning to ref
          if (isDestroyed) {
            try {
              wavesurfer.destroy();
            } catch (e) {
              console.error("Error destroying wavesurfer during cleanup:", e);
            }
            return;
          }

          wavesurferRef.current = wavesurfer;

          console.log(
            `Attempt ${retryCount + 1}: Loading audio into WaveSurfer...`,
          );
          await wavesurfer.load(url);
          console.log(`Attempt ${retryCount + 1}: WaveSurfer load initiated.`);
        } catch (error: any) {
          // Don't log errors if the component was destroyed or signal was aborted due to cleanup
          if (isDestroyed) {
            console.log(
              `Component destroyed during attempt ${retryCount + 1}, skipping error handling`,
            );
            return;
          }

          if (error.name === "AbortError") {
            console.log(
              `Attempt ${retryCount + 1} was aborted (likely due to component cleanup)`,
            );
            return; // Don't retry if aborted due to cleanup
          }

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
            // Only call onError for persistent failures, not temporary loading issues
            if (retryCount >= maxRetries) {
              onError?.();
            }
          }
        }
      };

      // Initialize WaveSurfer with a small delay to ensure cleanup is complete
      setTimeout(() => {
        if (!isDestroyed) {
          initWaveSurfer().catch((error) => {
            if (!isDestroyed) {
              console.error("Error in initWaveSurfer:", error);
              setErrorMessage("Failed to initialize audio visualization");
              setIsLoading(false);
            }
          });
        }
      }, 100);

      // Cleanup on unmount or when url changes
      return () => {
        isDestroyed = true;

        // Abort any ongoing fetch requests
        if (currentController) {
          currentController.abort();
          currentController = null;
        }

        if (wavesurferRef.current) {
          try {
            wavesurferRef.current.pause();
            wavesurferRef.current.destroy();
          } catch (error) {
            console.error("Error during WaveSurfer cleanup:", error);
          }
          wavesurferRef.current = null;
        }

        // Cleanup stereo waveforms
        if (leftWavesurferRef.current) {
          try {
            leftWavesurferRef.current.destroy();
          } catch (error) {
            console.error("Error during left WaveSurfer cleanup:", error);
          }
          leftWavesurferRef.current = null;
        }

        if (rightWavesurferRef.current) {
          try {
            rightWavesurferRef.current.destroy();
          } catch (error) {
            console.error("Error during right WaveSurfer cleanup:", error);
          }
          rightWavesurferRef.current = null;
        }
      };
    }, [url, isStereo, stereoUrl]);

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
                  // Only hide component for network errors that are persistent
                  onError?.();
                  break;
                case MediaError.MEDIA_ERR_DECODE:
                  setErrorMessage("The audio could not be decoded.");
                  onError?.();
                  break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  setErrorMessage("The audio format is not supported.");
                  onError?.();
                  break;
                default:
                  setErrorMessage("An error occurred while loading the audio.");
                  break;
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
      const leftWavesurfer = leftWavesurferRef.current;
      const rightWavesurfer = rightWavesurferRef.current;
      const audio = audioRef.current;

      if (!wavesurfer || !audio || !isWaveformReady) return;

      // Use WaveSurfer's event for time updates
      const handleWsAudioprocess = (time: number) => {
        setCurrentTime(time);

        // Sync stereo waveforms with main playback
        if (isStereo && isStereoReady && leftWavesurfer && rightWavesurfer) {
          const progress = time / (wavesurfer.getDuration() || 1);
          try {
            leftWavesurfer.seekTo(progress);
            rightWavesurfer.seekTo(progress);
          } catch (error) {
            console.warn("Error syncing stereo waveforms:", error);
          }
        }
      };

      // Keep listening to the audio element for metadata and end events
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      const handleEnded = () => {
        setIsPlaying(false);
        // Reset stereo waveforms too
        if (isStereo && leftWavesurfer && rightWavesurfer) {
          try {
            leftWavesurfer.seekTo(0);
            rightWavesurfer.seekTo(0);
          } catch (error) {
            console.warn("Error resetting stereo waveforms:", error);
          }
        }
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
      // Depend on isWaveformReady and isStereoReady to ensure wavesurfer is initialized
    }, [isWaveformReady, isStereo, isStereoReady]);

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

          {/* Main waveform (mono playback control) */}
          <div
            ref={waveformRef}
            className={cn(
              "w-full",
              isStereo ? "h-[48px] opacity-50" : "h-[96px]",
            )}
            onClick={(e) => {
              if (!isWaveformReady || !wavesurferRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPosition = (e.clientX - rect.left) / rect.width;
              const newTime = clickPosition * duration;
              handleSeek([newTime]);
            }}
          />

          {/* Stereo channel visualizations */}
          {isStereo && (
            <div className="mt-2 space-y-3">
              {/* Left Channel (typically AI) */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-green-600">
                    {leftChannelLabel || "Left Channel"}
                  </span>
                  <span className="text-xs text-gray-400">AI Assistant</span>
                </div>
                <div
                  ref={leftChannelRef}
                  className="w-full h-[64px] bg-green-50 rounded"
                />
              </div>

              {/* Right Channel (typically Customer) */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-red-600">
                    {rightChannelLabel || "Right Channel"}
                  </span>
                  <span className="text-xs text-gray-400">Customer</span>
                </div>
                <div
                  ref={rightChannelRef}
                  className="w-full h-[64px] bg-red-50 rounded"
                />
              </div>
            </div>
          )}
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
