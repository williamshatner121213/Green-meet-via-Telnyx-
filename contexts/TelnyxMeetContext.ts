import { NetworkMetrics } from '@telnyx/video';
import React, { Dispatch, SetStateAction } from 'react';

import { TelnyxRoom } from 'hooks/room';

const TelnyxMeetContext = React.createContext<{
  audioInputDeviceId: string | undefined;
  audioOutputDeviceId: string | undefined;
  videoInputDeviceId: string | undefined;
  unreadMessages: React.MutableRefObject<TelnyxRoom['messages'] | null>;
  setAudioInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setAudioOutputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setVideoInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  isAudioTrackEnabled: boolean;
  isVideoTrackEnabled: boolean;
  setIsAudioTrackEnabled: Dispatch<SetStateAction<boolean>>;
  setIsVideoTrackEnabled: Dispatch<SetStateAction<boolean>>;
  sendNotification: (message: { body: string }) => void;
  networkMetrics: NetworkMetrics | undefined;
  setNetworkMetrics: Dispatch<SetStateAction<NetworkMetrics | undefined>>;
  optionalFeatures: { [key: string]: boolean };
  isVideoPlaying: boolean;
  setIsVideoPlaying: Dispatch<SetStateAction<boolean>>;
}>({
  audioInputDeviceId: undefined,
  audioOutputDeviceId: undefined,
  videoInputDeviceId: undefined,
  unreadMessages: React.createRef<TelnyxRoom['messages'] | null>(),

  setAudioInputDeviceId: (
    value: React.SetStateAction<string | undefined>
  ) => {},
  setAudioOutputDeviceId: (
    value: React.SetStateAction<string | undefined>
  ) => {},
  setVideoInputDeviceId: (
    value: React.SetStateAction<string | undefined>
  ) => {},
  isAudioTrackEnabled: false,
  isVideoTrackEnabled: false,
  setIsAudioTrackEnabled: (value: React.SetStateAction<boolean>) => {},
  setIsVideoTrackEnabled: (value: React.SetStateAction<boolean>) => {},
  sendNotification: (message: { body: string }) => {},
  networkMetrics: undefined,
  setNetworkMetrics: (
    value: React.SetStateAction<NetworkMetrics | undefined>
  ) => {},
  optionalFeatures: {},
  isVideoPlaying: false,
  setIsVideoPlaying: (value: React.SetStateAction<boolean>) => {},
});

export { TelnyxMeetContext };
