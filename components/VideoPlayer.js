'use client';

import { forwardRef } from 'react';
import { getEmbedUrl } from '@/lib/utils';

/** Plays YouTube / Vimeo links in an iframe and direct files (mp4, webm, m3u8...) in a <video>. */
const VideoPlayer = forwardRef(function VideoPlayer({ url, poster, onEnded, autoPlay = false }, ref) {
  if (!url) {
    return (
      <div className="text-center text-white-50 p-5">
        <i className="bi bi-camera-video-off fs-1 d-block mb-2" />
        No video for this lecture
      </div>
    );
  }
  const embed = getEmbedUrl(url);
  if (embed) {
    return (
      <iframe
        key={embed}
        src={embed}
        title="Lecture video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <video
      key={url}
      ref={ref}
      src={url}
      poster={poster}
      controls
      autoPlay={autoPlay}
      playsInline
      controlsList="nodownload"
      onEnded={onEnded}
    />
  );
});

export default VideoPlayer;
