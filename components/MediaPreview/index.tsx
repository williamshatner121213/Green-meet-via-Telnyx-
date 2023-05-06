import React, { useState, useEffect, useRef, useContext } from 'react';
import { Button, Text } from 'grommet';
import styled from 'styled-components';
import { videoDiagnostics } from '@telnyx/rtc-diagnostics';

import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

import ErrorDialog from 'components/ErrorDialog';

import { MediaControlBar } from './MediaControlBar';
import { VirtualBackground } from 'utils/virtualBackground';

const breakpointSmall = 400;
const breakpointMedium = 530;
const breakpointLarge = 1450;

const VideoPreview = styled.div`
  position: relative;
  background-color: #202124;
  border-radius: 8px;
  overflow: hidden;
  align-self: center;
  min-width: 320px;
  height: 160px;

  @media (min-width: ${breakpointSmall}px) {
    min-width: 390px;
    height: 195px;
  }

  @media (min-width: ${breakpointMedium}px) {
    min-width: 500px;
    height: 250px;
  }

  @media (min-width: ${breakpointLarge}px) {
    min-width: 700px;
    height: 350px;
  }
`;

function MediaPreview() {
  const {
    audioInputDeviceId,
    videoInputDeviceId,
    isAudioTrackEnabled,
    isVideoTrackEnabled,
    setIsAudioTrackEnabled,
    setIsVideoTrackEnabled,
    optionalFeatures,
  } = useContext(TelnyxMeetContext);

  const [localTracks, setLocalTracks] = useState<{
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  }>({
    audio: undefined,
    video: undefined,
  });

  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);

  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  const videoElRef = useRef<HTMLVideoElement>(null);
  const camera = useRef() as VirtualBackground['camera'];
  //https://github.com/DefinitelyTyped/DefinitelyTyped/issues/28884#issuecomment-471341041
  const videoProcessor = useRef() as VirtualBackground['videoProcessor'];

  useEffect(() => {
    return () => {
      if (localTracks.audio) {
        localTracks?.audio?.stop();
      }
    };
  }, [localTracks?.audio]);

  useEffect(() => {
    if (!videoElRef.current) {
      return;
    }

    if (localTracks?.video) {
      videoElRef.current.srcObject = new MediaStream([localTracks.video]);
    }

    return function cleanup() {
      if (localTracks.video) {
        localTracks.video?.stop();
      }
    };
  }, [localTracks?.video]);

  useEffect(() => {
    return function cleanup() {
      if (localTracks.video) {
        localTracks.video?.stop();
        camera.current?.stop();
        videoProcessor.current?.stop();
        videoProcessor.current = null;
        camera.current = null;
      }
    };
  }, [localTracks?.video, videoProcessor, camera]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#cecece',
        height: '100%',
        width: '100%',
      }}
    >
      {optionalFeatures?.isDiagnosticsEnabled && (
        <Button
          style={{ position: 'fixed', top: 10, right: 10 }}
          onClick={async () => {
            setLoadingDiagnostics(true);
            const diagnostics = await videoDiagnostics();
            alert(JSON.stringify(diagnostics, null, 2));
            setLoadingDiagnostics(false);
          }}
          label={loadingDiagnostics ? 'Loading...' : 'Diagnostics'}
          disabled={loadingDiagnostics}
          secondary
        />
      )}

      {error && (
        <ErrorDialog onClose={() => setError(undefined)} error={error} />
      )}

      <VideoPreview id='preview-video'>
        {isVideoTrackEnabled ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: '100%',
              borderRadius: '8px',
              transform: 'scaleX(-1)',
              objectFit: 'cover',
            }}
          >
            <canvas
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: '100%',
                borderRadius: '8px',
                objectFit: 'cover',
                zIndex: camera.current ? 1 : 0,
              }}
              id='canvas'
              className='hide'
            ></canvas>
            <video
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: '100%',
                borderRadius: '8px',
                objectFit: 'cover',
                zIndex: !camera.current ? 1 : 0,
              }}
              id='video-preview'
              ref={videoElRef}
              playsInline={true}
              autoPlay={true}
              muted={true}
            ></video>
          </div>
        ) : (
          <Text
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              color: '#fff',
              transform: 'translateX(-50%)',
            }}
          >
            Camera is off
          </Text>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 5,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
          }}
        >
          <MediaControlBar
            audioInputDeviceId={audioInputDeviceId}
            videoInputDeviceId={videoInputDeviceId}
            isAudioTrackEnabled={isAudioTrackEnabled}
            isVideoTrackEnabled={isVideoTrackEnabled}
            setIsAudioTrackEnabled={setIsAudioTrackEnabled}
            setIsVideoTrackEnabled={setIsVideoTrackEnabled}
            optionalFeatures={optionalFeatures}
            localTracks={localTracks}
            setLocalTracks={setLocalTracks}
            setError={setError}
            camera={camera}
            videoProcessor={videoProcessor}
            //@ts-ignore
            videoRef={videoElRef}
          />
        </div>
      </VideoPreview>
    </div>
  );
}

export default MediaPreview;
