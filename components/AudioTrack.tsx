import React, { useRef, useEffect } from 'react';

export default function AudioTrack({
  id,
  audioTrack,
  audioOutputDeviceId,
}: {
  id: string;
  audioTrack: MediaStreamTrack;
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
}) {
  const mediaWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioTrack || !mediaWrapperRef.current) {
      return;
    }

    const audioEl = document.createElement('audio');
    audioEl.id = `${id}-audio`;
    audioEl.autoplay = true;

    const mediaStream = new MediaStream([audioTrack]);

    if (audioOutputDeviceId) {
      console.debug('audioOutputDeviceId: ', audioOutputDeviceId);

      // NOTE: Make sure the src is set before setSinkId!!!
      audioEl.srcObject = mediaStream;

      // @ts-expect-error
      audioEl.setSinkId(audioOutputDeviceId).then(() => {
        if (!mediaWrapperRef.current) {
          return;
        }

        mediaWrapperRef.current.appendChild(audioEl);
        // @ts-expect-error
        console.debug('Audio output changed to ' + audioEl.sinkId);
      });
    } else {
      audioEl.srcObject = mediaStream;
      mediaWrapperRef.current.appendChild(audioEl);
      console.debug('Audio output changed to default output');
    }

    return () => {
      const existingAudioEl = document.getElementById(`${id}-audio`);
      if (existingAudioEl) {
        existingAudioEl.remove();
      }

      if (audioEl && audioEl.srcObject) {
        audioEl.srcObject = null;
        audioEl.remove();
      }
    };
  }, [audioTrack, audioOutputDeviceId, id]);

  return <div ref={mediaWrapperRef} />;
}
