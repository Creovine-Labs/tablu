import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface Props {
  src: string;
  poster?: string | null;
  className?: string;
  /** inline card autoplay (muted loop) vs full player with sound/controls */
  inline?: boolean;
  controls?: boolean;
}

export function MuxVideo({ src, poster, className, inline = true, controls = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // The autoplay attribute alone is unreliable once hls.js attaches media
    // after mount — kick playback explicitly when enough data is ready.
    const tryPlay = () => { if (inline) video.play().catch(() => {}); };

    let hls: Hls | undefined;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari / iOS play HLS natively
      video.src = src;
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true, // never fetch a 1080p rendition for a small card
        startLevel: -1, // auto bitrate based on bandwidth
        maxBufferLength: 10, // keep buffers lean — a menu can have many videos
        backBufferLength: 5,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
    } else {
      video.src = src; // last-ditch
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
    }

    // Smoothness: only the cards actually on screen play; the rest pause so a
    // long menu never decodes dozens of streams at once.
    let io: IntersectionObserver | undefined;
    if (inline && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        },
        { threshold: 0.25 },
      );
      io.observe(video);
    }

    return () => {
      io?.disconnect();
      hls?.destroy();
    };
  }, [src, inline]);

  return (
    <video
      ref={ref}
      poster={poster || undefined}
      className={className}
      muted={inline}
      loop={inline}
      autoPlay={inline}
      playsInline
      controls={controls}
      preload="metadata"
    />
  );
}
