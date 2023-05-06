import { Stream } from '@telnyx/video';
import React, { useRef, useEffect } from 'react';
import { useState } from 'react';
import { getBrowserName, getPlatform } from 'utils/helpers';
import { VirtualBackground } from 'utils/virtualBackground';

export default function VideoTrack({
  id,
  stream,
  mirrorVideo,
  dataTestId,
  isPresentation,
  virtualBackgroundCamera = null,
}: {
  id: string;
  stream: Stream;
  mirrorVideo: boolean;
  dataTestId: string;
  isPresentation: boolean;
  virtualBackgroundCamera: VirtualBackground['camera'] | null;
}) {
  const [isPortrait, setIsPortrait] = useState(false);
  const videoElRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoElRef.current;

    if (!videoEl || !stream?.videoTrack) {
      return;
    }

    setIsPortrait(
      stream.videoTrack.getSettings().height! >
        stream.videoTrack.getSettings().width!
    );

    videoEl.srcObject = new MediaStream([stream.videoTrack]);

    // When Feed update in DOM we need to start virtual background canvas
    if (
      virtualBackgroundCamera &&
      virtualBackgroundCamera.current &&
      getBrowserName() === 'chrome' &&
      getPlatform()?.type === 'desktop' &&
      //https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStreamTrack
      //@ts-ignore
      stream.videoTrack instanceof CanvasCaptureMediaStreamTrack
    ) {
      virtualBackgroundCamera.current?.start();
    }

    return function cleanup() {
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [stream?.videoTrack, virtualBackgroundCamera]);

  return (
    <div
      style={{
        height: '100%',
      }}
    >
      <canvas
        style={{
          transform: mirrorVideo ? 'scaleX(-1)' : 'unset',
          visibility: 'visible',
          height: '100%',
          width: '100%',
          objectFit: isPortrait || isPresentation ? 'contain' : 'cover',
          position: 'absolute',
          zIndex: virtualBackgroundCamera?.current ? 1 : 0,
        }}
        id='canvas'
        width={250}
        height={80}
      ></canvas>
      <video
        id={id}
        data-testid={dataTestId}
        ref={videoElRef}
        playsInline={true}
        autoPlay={true}
        muted={true}
        style={{
          transform: mirrorVideo ? 'scaleX(-1)' : 'unset',
          visibility: 'visible',
          height: '100%',
          width: '100%',
          objectFit: isPortrait || isPresentation ? 'contain' : 'cover',
          position: 'absolute',
          zIndex: !virtualBackgroundCamera?.current ? 1 : 0,
        }}
        width={250}
        height={80}
      />
    </div>
  );
}
