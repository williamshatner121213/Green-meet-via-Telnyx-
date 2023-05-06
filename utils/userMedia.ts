const getMediaConstraints = (
  kind: 'audio' | 'video',
  deviceId: string | undefined,
  options?: { [key: string]: boolean }
) => {
  const mediaConstraints: {
    deviceId?: string;
    width?: number;
    height?: number;
  } = {};

  if (deviceId) {
    mediaConstraints.deviceId = deviceId;
  }

  if (kind === 'video' && options && options.isSimulcastEnabled) {
    mediaConstraints.width = 1280;
    mediaConstraints.height = 720;
  }

  return Object.keys(mediaConstraints).length !== 0 ? mediaConstraints : true;
};

export const getUserMedia = async ({
  kind,
  deviceId,
  options,
  callbacks,
}: {
  kind: 'audio' | 'video';
  deviceId: string | undefined;
  options?: { [key: string]: boolean };
  callbacks: {
    onTrackUpdate: (
      kind: 'audio' | 'video',
      track: MediaStreamTrack | undefined
    ) => void;
    onDeviceError: (kind: 'audio' | 'video') => void;
  };
}) => {
  await navigator?.mediaDevices
    ?.getUserMedia({
      [kind]: getMediaConstraints(kind, deviceId, options),
    })
    .then((stream) => {
      const track =
        kind === 'audio'
          ? stream?.getAudioTracks()[0]
          : stream?.getVideoTracks()[0];

      typeof callbacks.onTrackUpdate === 'function' &&
        callbacks.onTrackUpdate(kind, track);
    })
    .catch((error) => {
      if (
        error instanceof DOMException &&
        error.name === 'NotAllowedError' &&
        typeof callbacks.onDeviceError === 'function'
      ) {
        callbacks.onDeviceError(kind);
      }
    });
};
