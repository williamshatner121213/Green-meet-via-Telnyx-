import { useState, useEffect, useContext, useRef } from 'react';
import { getDevices, Participant, Room, Stream } from '@telnyx/video';
import { Box, Button, Text } from 'grommet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Group as GroupIcon, UserAdd as InviteIcon } from 'grommet-icons';

import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faLaptop,
  faAngleDown,
} from '@fortawesome/free-solid-svg-icons';

import { TelnyxRoom } from 'hooks/room';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';
import ErrorDialog from 'components/ErrorDialog';

import { getUserMedia } from 'utils/userMedia';
import {
  getItemSessionStorage,
  saveItemSessionStorage,
  USER_PREFERENCE_BACKGROUND_TYPE,
} from 'utils/storage';

import {
  addVirtualBackgroundStream,
  imagesOptions,
  VirtualBackground,
} from 'utils/virtualBackground';

import { MenuList } from '../MenuList';
import { Chat } from '../Chat';
import { ControllerBox, LeaveButton, RightBoxMenu } from './styles';
import { DeviceMenuList } from './DeviceMenuList';
import { ChatButton } from './ChatButton';
import { ControlButton } from './ControlButton';
import { getBrowserName, getPlatform } from 'utils/helpers';

const isSinkIdSupported = (): boolean => {
  const audio = document.createElement('audio');
  // @ts-expect-error
  return typeof audio?.setSinkId === 'function';
};

type RoomControlsProps = {
  isParticipantsListVisible: boolean;
  isInviteParticipantVisible: boolean;
  useMixedAudioForOutput: boolean;
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  addStream: TelnyxRoom['addStream'];
  removeStream: TelnyxRoom['removeStream'];
  updateStream: TelnyxRoom['updateStream'];
  disconnect: TelnyxRoom['disconnect'];
  setIsParticipantsListVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsInviteParticipantVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setUseMixedAudioForOutput: React.Dispatch<React.SetStateAction<boolean>>;
  streams: { [key: string]: Stream };
  disableScreenshare: boolean;
  sendMessage: Room['sendMessage'];
  messages: TelnyxRoom['messages'];
  getLocalParticipant: () => Participant;
  camera: VirtualBackground['camera'];
};

export default function RoomControls({
  isParticipantsListVisible,
  isInviteParticipantVisible,
  useMixedAudioForOutput,
  setIsParticipantsListVisible,
  setIsInviteParticipantVisible,
  setUseMixedAudioForOutput,
  streams,
  disableScreenshare,
  participantsByActivity,
  addStream,
  removeStream,
  updateStream,
  disconnect,
  sendMessage,
  messages,
  getLocalParticipant,
  camera,
}: RoomControlsProps) {
  const {
    audioInputDeviceId,
    audioOutputDeviceId,
    videoInputDeviceId,
    setAudioInputDeviceId,
    setAudioOutputDeviceId,
    setVideoInputDeviceId,
    unreadMessages,
    isAudioTrackEnabled,
    isVideoTrackEnabled,
    setIsAudioTrackEnabled,
    setIsVideoTrackEnabled,
    optionalFeatures,
    isVideoPlaying,
  } = useContext(TelnyxMeetContext);

  //https://github.com/DefinitelyTyped/DefinitelyTyped/issues/28884#issuecomment-471341041
  const videoProcessor = useRef() as VirtualBackground['videoProcessor'];

  const [virtualBackgroundType, setVirtualBackgroundType] = useState<
    string | undefined
  >();

  const [devices, setDevices] = useState<any>({});
  const [localTracks, setLocalTracks] = useState<{
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  }>({
    audio: undefined,
    video: undefined,
  });
  const [presentationTracks, setPresentationTracks] = useState<{
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  }>({
    audio: undefined,
    video: undefined,
  });
  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);

  const [showChatBox, setShowChatBox] = useState(false);

  const selfStream = streams.self;
  const presentationStream = streams.presentation;
  const participantCount = participantsByActivity.size;
  const localParticipant = getLocalParticipant();

  const context = localParticipant.context
    ? JSON.parse(localParticipant.context)
    : undefined;

  const VIDEO_ELEMENT_ID = `video-feed-${context.username
    ?.toLowerCase()
    .replace(' ', '-')}`;

  useEffect(() => {
    // get devices if permissions are already granted
    getAndSetDevices();
    navigator?.mediaDevices?.addEventListener('devicechange', getAndSetDevices);

    return () => {
      navigator?.mediaDevices?.removeEventListener(
        'devicechange',
        getAndSetDevices
      );
    };
  }, []);

  useEffect(() => {
    if (!selfStream) {
      addStream('self', {
        audio: localTracks.audio,
        video: {
          track: localTracks.video,
          options: { enableSimulcast: optionalFeatures.isSimulcastEnabled },
        },
      });

      return;
    }

    if (
      selfStream.isConfigured &&
      (selfStream.audioTrack !== localTracks.audio ||
        selfStream.videoTrack !== localTracks.video)
    ) {
      updateStream('self', localTracks);
    }
    // TODO: avoid disable line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfStream, localTracks]);

  useEffect(() => {
    if (presentationTracks.video) {
      if (!presentationStream) {
        addStream('presentation', {
          audio: presentationTracks.audio,
          video: {
            track: presentationTracks.video,
            options: { enableSimulcast: optionalFeatures.isSimulcastEnabled },
          },
        });
      }

      presentationTracks.video.onended = () => {
        removeStream('presentation');
        setPresentationTracks({ audio: undefined, video: undefined });
      };
    }
    // TODO: avoid disable line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationStream, presentationTracks]);

  useEffect(() => {
    if (isAudioTrackEnabled) {
      getUserMedia({
        kind: 'audio',
        deviceId: audioInputDeviceId,
        callbacks: {
          onTrackUpdate: handleTrackUpdate,
          onDeviceError: handleDeviceError,
        },
      });
    }

    if (isVideoTrackEnabled) {
      getUserMedia({
        kind: 'video',
        deviceId: videoInputDeviceId,
        options: optionalFeatures,
        callbacks: {
          onTrackUpdate: handleTrackUpdate,
          onDeviceError: handleDeviceError,
        },
      });
    }
    // TODO: avoid disable line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      isVideoPlaying &&
      getBrowserName() === 'chrome' &&
      getPlatform()?.type === 'desktop'
    ) {
      const videoElement = document.getElementById(VIDEO_ELEMENT_ID);

      const backgroundValue = getItemSessionStorage(
        USER_PREFERENCE_BACKGROUND_TYPE
      );

      if (videoElement && backgroundValue && backgroundValue !== 'none') {
        getUserMedia({
          kind: 'video',
          deviceId: undefined,
          options: optionalFeatures,
          callbacks: {
            onTrackUpdate: async (
              kind: 'audio' | 'video',
              track: MediaStreamTrack | undefined
            ) => {
              if (kind === 'video' && track) {
                if (localTracks.video) {
                  localTracks.video?.stop();
                  await videoProcessor.current?.stop();
                  videoProcessor.current = null;
                }

                addVirtualBackgroundStream({
                  videoProcessor: videoProcessor,
                  camera: camera,
                  videoElementId: VIDEO_ELEMENT_ID,
                  canvasElementId: 'canvas',
                  videoTrack: track,
                  backgroundValue: backgroundValue,
                }).then((videoTrack) => {
                  setVideoInputDeviceId(track.id);

                  setLocalTracks((value) => ({
                    ...value,
                    video: videoTrack,
                  }));

                  setVirtualBackgroundType(backgroundValue);
                });
              }
            },
            onDeviceError: handleDeviceError,
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoPlaying]);

  const handleVirtualBg = async (selectedValue: string) => {
    saveItemSessionStorage(USER_PREFERENCE_BACKGROUND_TYPE, selectedValue);
    setVirtualBackgroundType(selectedValue);

    if (localTracks.video) {
      localTracks.video?.stop();
      await videoProcessor.current?.stop();
      videoProcessor.current = null;

      getUserMedia({
        kind: 'video',
        deviceId: undefined,
        callbacks: {
          onTrackUpdate: async (
            kind: 'audio' | 'video',
            track: MediaStreamTrack | undefined
          ) => {
            if (kind === 'video' && track) {
              const canvasVideoTrack = await addVirtualBackgroundStream({
                videoProcessor,
                camera,
                videoElementId: VIDEO_ELEMENT_ID,
                canvasElementId: 'canvas',
                videoTrack: track,
                backgroundValue: selectedValue,
              });

              setVideoInputDeviceId(track.id);

              setLocalTracks((value) => ({
                ...value,
                video:
                  selectedValue && selectedValue !== 'none'
                    ? canvasVideoTrack
                    : track,
              }));
            }
          },
          onDeviceError: handleDeviceError,
        },
      });
    }
  };

  const handleTrackUpdate = (
    kind: 'audio' | 'video',
    track: MediaStreamTrack | undefined
  ) => {
    if (kind === 'audio') {
      setIsAudioTrackEnabled(track !== undefined ? true : false);
    }

    if (kind === 'video') {
      setIsVideoTrackEnabled(track !== undefined ? true : false);
    }

    setLocalTracks((tracks) => ({ ...tracks, [kind]: track }));
  };

  const handleDeviceError = (kind: 'audio' | 'video' | 'screenshare') => {
    if (kind === 'audio') {
      setError({
        title: 'Microphone unavailable',
        body: 'Please check browser media permission settings.',
      });
    }

    if (kind === 'video') {
      setError({
        title: 'Camera unavailable',
        body: 'Please check browser media permission settings.',
      });
    }

    if (kind === 'screenshare') {
      setError({
        title: 'Screen share unavailable',
        body: 'Failed to share your screen.',
      });
    }
  };

  const handleAudioClick = () => {
    if (localTracks.audio) {
      localTracks.audio.stop();
      if (selfStream.audioTrack) {
        selfStream.audioTrack.stop();
      }
      handleTrackUpdate('audio', undefined);
    } else {
      getUserMedia({
        kind: 'audio',
        deviceId: audioInputDeviceId,
        callbacks: {
          onTrackUpdate: handleTrackUpdate,
          onDeviceError: handleDeviceError,
        },
      });
    }
  };

  const handleVideoClick = () => {
    if (localTracks.video) {
      localTracks.video.stop();
      if (selfStream.videoTrack) {
        selfStream.videoTrack.stop();
      }

      if (camera && camera.current) {
        camera.current?.stop();
        camera.current = null;
      }

      if (videoProcessor && videoProcessor.current) {
        videoProcessor.current.stop();
        videoProcessor.current = null;
      }

      saveItemSessionStorage(USER_PREFERENCE_BACKGROUND_TYPE, 'none');
      setVirtualBackgroundType('none');

      handleTrackUpdate('video', undefined);
    } else {
      getUserMedia({
        kind: 'video',
        deviceId: videoInputDeviceId,
        options: optionalFeatures,
        callbacks: {
          onTrackUpdate: handleTrackUpdate,
          onDeviceError: handleDeviceError,
        },
      });
    }
  };

  const handleShareScreenClick = () => {
    if (presentationTracks.audio || presentationTracks.video) {
      presentationTracks.audio?.stop();
      presentationTracks.video?.stop();
      if (presentationStream) {
        removeStream('presentation');
      }
      setPresentationTracks({ audio: undefined, video: undefined });
    } else {
      navigator?.mediaDevices
        ?.getDisplayMedia({ audio: true, video: true })
        .then((stream) => {
          setPresentationTracks({
            audio: stream?.getAudioTracks()[0],
            video: stream?.getVideoTracks()[0],
          });
        })
        .catch((error) => {
          if (
            error instanceof DOMException &&
            error.name === 'NotAllowedError'
          ) {
            handleDeviceError('screenshare');
          }
        });
    }
  };

  const handleDeviceChange = (
    kind: 'audio_input' | 'video_input' | 'audio_output',
    deviceId: string
  ) => {
    console.debug('[video-meet] Device changed: ', kind, ' id: ', deviceId);

    if (kind === 'audio_input') {
      setAudioInputDeviceId(deviceId);

      if (localTracks.audio) {
        localTracks.audio.stop();
        getUserMedia({
          kind: 'audio',
          deviceId: deviceId,
          callbacks: {
            onTrackUpdate: handleTrackUpdate,
            onDeviceError: handleDeviceError,
          },
        });
      }
    }

    if (kind === 'video_input') {
      setVideoInputDeviceId(deviceId);

      if (localTracks.video) {
        localTracks.video.stop();
        getUserMedia({
          kind: 'video',
          deviceId: deviceId,
          options: optionalFeatures,
          callbacks: {
            onTrackUpdate: handleTrackUpdate,
            onDeviceError: handleDeviceError,
          },
        });
      }
    }

    if (kind === 'audio_output') {
      setAudioOutputDeviceId(deviceId);
    }
  };

  const getAndSetDevices = () => {
    getDevices()
      .then(setDevices)
      .catch(() => {
        setDevices({});
      });
  };

  const handleLeaveRoom = () => {
    localTracks?.audio?.stop();
    localTracks?.video?.stop();
    presentationTracks?.audio?.stop();
    presentationTracks?.video?.stop();
    disconnect();
  };

  const hasUnreadMessages = () => {
    if (unreadMessages.current && unreadMessages.current.length > 0) {
      return true;
    }
    return false;
  };

  const checkBubbleNotification = () => {
    if (messages && messages.length > 0) {
      const lastMessage = messages.length - 1;
      const isNotLocalParticipantMessage =
        messages[lastMessage].from !== localParticipant.id;
      const existUnreadMessages = hasUnreadMessages();

      if (isNotLocalParticipantMessage && !showChatBox && existUnreadMessages) {
        return true;
      }
    }
    return false;
  };

  const getTotalUnreadMessages = () => {
    if (!unreadMessages || !unreadMessages.current) {
      return 1;
    }
    return unreadMessages.current.length;
  };

  const showBubbleNotification = checkBubbleNotification();

  return (
    <Box
      gridArea='controls'
      direction='row'
      align='center'
      justify='between'
      style={{
        zIndex: 2,
        backgroundColor: '#000',
      }}
    >
      {error && (
        <ErrorDialog onClose={() => setError(undefined)} error={error} />
      )}

      {showChatBox && (
        <Chat
          sendMessage={sendMessage}
          messages={messages}
          onClose={() => {
            setShowChatBox(false);
            unreadMessages.current = [];
          }}
          localParticipant={localParticipant}
        ></Chat>
      )}

      <Box pad='small' direction='row' gap='medium'>
        <Box width='80px'>
          <ControlButton
            dataTestId='btn-toggle-audio'
            size='large'
            onClick={handleAudioClick}
            disabled={!selfStream?.isConfigured}
            enabledIcon={{
              icon: faMicrophone,
              label: 'Mute mic',
            }}
            disabledIcon={{
              icon: faMicrophoneSlash,
              label: 'Unmute mic',
            }}
            showEnabledIcon={selfStream?.isAudioEnabled}
          />
        </Box>
        <Box width='80px'>
          <ControlButton
            dataTestId='btn-toggle-video'
            data-e2e='toggle video'
            size='large'
            onClick={handleVideoClick}
            disabled={!selfStream?.isConfigured}
            enabledIcon={{
              icon: faVideo,
              label: 'Stop video',
            }}
            disabledIcon={{
              icon: faVideoSlash,
              label: 'Start video',
            }}
            showEnabledIcon={selfStream?.isVideoEnabled}
          />
        </Box>
        <ControllerBox width='80px'>
          <ControlButton
            dataTestId='btn-toggle-screen-sharing'
            size='large'
            disabled={disableScreenshare}
            enabledIcon={{
              icon: faLaptop,
              label: 'Stop share',
            }}
            disabledIcon={{
              icon: faLaptop,
              label: 'Start share',
            }}
            showEnabledIcon={presentationStream?.isVideoEnabled}
            onClick={handleShareScreenClick}
          />
        </ControllerBox>
        <ControllerBox width='80px'>
          <Button
            data-testid='btn-toggle-participant-list'
            size='large'
            onClick={() => {
              if (isInviteParticipantVisible) {
                setIsInviteParticipantVisible(false);
              }
              setIsParticipantsListVisible(!isParticipantsListVisible);
            }}
          >
            <Box align='center' gap='xsmall'>
              <Box style={{ position: 'relative' }}>
                <GroupIcon
                  size='large'
                  color={isParticipantsListVisible ? 'accent-1' : 'light-5'}
                />
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    transform: 'translateX(100%)',
                  }}
                >
                  <Text color='accent-1'>{participantCount}</Text>
                </Box>
              </Box>
              <Text size='xsmall' color='light-6'>
                Participants
              </Text>
            </Box>
          </Button>
        </ControllerBox>
        {optionalFeatures.isDialOutEnabled && (
          <ControllerBox width='80px'>
            <Button
              data-testid='btn-invite-participant'
              size='large'
              onClick={() => {
                if (isParticipantsListVisible) {
                  setIsParticipantsListVisible(false);
                }
                setIsInviteParticipantVisible(!isInviteParticipantVisible);
              }}
            >
              <Box align='center' gap='xsmall'>
                <InviteIcon
                  size='large'
                  color={isInviteParticipantVisible ? 'accent-1' : 'light-5'}
                />
                <Text size='xsmall' color='light-6'>
                  Invite
                </Text>
              </Box>
            </Button>
          </ControllerBox>
        )}

        {localParticipant.canReceiveMessages && (
          <ControllerBox>
            <ChatButton
              onClick={() => {
                setShowChatBox((value) => !value);
                unreadMessages.current = [];
              }}
              totalUnreadMessages={
                showBubbleNotification ? getTotalUnreadMessages() : 0
              }
              isChatBoxOpened={showChatBox}
            />
          </ControllerBox>
        )}
      </Box>

      <RightBoxMenu pad='small' direction='row' gap='large'>
        {getBrowserName() === 'chrome' && getPlatform()?.type === 'desktop' && (
          <span style={{ color: '#fff' }}>
            <MenuList
              disabled={!selfStream?.isVideoEnabled}
              selectedValue={virtualBackgroundType}
              title='Change background'
              data={imagesOptions}
              onChange={(item) => handleVirtualBg(item.value)}
              icon={<FontAwesomeIcon icon={faAngleDown} fixedWidth />}
              itemsIconOptions={{
                gap: 'small', // gap between icon and text
                reverse: true, // icon on right
              }}
            ></MenuList>
          </span>
        )}

        {optionalFeatures && optionalFeatures.isAudioControlEnabled && (
          <Box>
            <Button
              onClick={() => {
                setUseMixedAudioForOutput(!useMixedAudioForOutput);
              }}
            >
              <Text>{`Toggle Mixed Audio: ${
                useMixedAudioForOutput ? 'On' : 'Off'
              }`}</Text>
            </Button>
          </Box>
        )}

        <DeviceMenuList
          kind='audio_input'
          devices={devices?.audioinput}
          selectedDeviceId={audioInputDeviceId}
          handleDeviceChange={handleDeviceChange}
        />

        <DeviceMenuList
          kind='video_input'
          devices={devices?.videoinput}
          selectedDeviceId={videoInputDeviceId}
          handleDeviceChange={handleDeviceChange}
        />

        {isSinkIdSupported() && (
          <DeviceMenuList
            kind='audio_output'
            devices={devices?.audiooutput}
            selectedDeviceId={audioOutputDeviceId}
            handleDeviceChange={handleDeviceChange}
          />
        )}
      </RightBoxMenu>

      <LeaveButton
        data-testid='btn-leave-room'
        label='Leave'
        onClick={handleLeaveRoom}
        color='status-error'
      />
    </Box>
  );
}
