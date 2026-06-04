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

    // Safari / iOS play HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
    video.src = src; // last-ditch
  }, [src]);

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
