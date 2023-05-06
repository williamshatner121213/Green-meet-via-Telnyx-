import { Fragment, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { Main } from 'grommet';
import toast, { Toaster } from 'react-hot-toast';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { NetworkMetrics } from '@telnyx/video';

import Room from 'components/Room';
import JoinRoom from 'components/JoinRoom';
import MediaPreview from 'components/MediaPreview';

import { generateUsername, generateId, getPlatform } from 'utils/helpers';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

import { TelnyxRoom } from 'hooks/room';
import { getItem, saveItem, USERNAME_KEY } from 'utils/storage';
import { MediaDeviceErrors } from 'components/MediaPreview/helper';
import ErrorDialog from 'components/ErrorDialog';

const breakpointMedium = 1021;

const GridPreviewContainer = styled.div`
  display: grid;
  height: 100%;
  width: 100%;
  grid-template-columns: 1fr;
  align-items: center;

  @media (min-width: ${breakpointMedium}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

function getUserName(): string {
  let user = getItem(USERNAME_KEY);
  if (user) {
    return user;
  } else {
    return generateUsername();
  }
}

const MAX_RECONNECT_TIME = 3;
export default function Rooms({
  id,
  clientToken,
  refreshToken,
}: {
  id: string;
  clientToken: string;
  refreshToken: string;
}) {
  const router = useRouter();
  const queryParameters = router.query as {
    audio_control: string;
    dial_out: string;
    network_metrics: string;
    simulcast: string;
    virtual_background: string;
    diagnostics: string;
    auto_reconnect: string;
  };
  const optionalFeatures = {
    isAudioControlEnabled: queryParameters.audio_control === 'true',
    isDialOutEnabled: queryParameters.dial_out === 'true',
    isNetworkMetricsEnabled: queryParameters.network_metrics === 'true',
    isSimulcastEnabled: queryParameters.simulcast === 'true',
    isDiagnosticsEnabled: queryParameters.diagnostics === 'true',
    isAutoReconnectEnabled: queryParameters.auto_reconnect === 'true',
  };

  const [roomId, setRoomId] = useState<string>();
  const [username, setUsername] = useState<string>('');
  const [tokens, setTokens] = useState<{
    clientToken: string;
    refreshToken: string;
  }>({
    clientToken: '',
    refreshToken: '',
  });
  const [isReady, setIsReady] = useState(false);

  const [audioInputDeviceId, setAudioInputDeviceId] = useState<
    string | undefined
  >();
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<
    string | undefined
  >();
  const [videoInputDeviceId, setVideoInputDeviceId] = useState<
    string | undefined
  >();

  const unreadMessages = useRef<TelnyxRoom['messages'] | null>(null);

  const [isAudioTrackEnabled, setIsAudioTrackEnabled] =
    useState<boolean>(false);
  const [isVideoTrackEnabled, setIsVideoTrackEnabled] =
    useState<boolean>(false);
  const sendNotification = (message: { body: string }) => {
    toast(message.body, {
      duration: 6000,
      style: {
        minWidth: '420px',
        background: '#000',
        color: '#dadada',
      },
    });
  };

  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics>();

  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);

  const [reconnectCount, setReconnectCount] = useState(1);

  useEffect(() => {
    setUsername(getUserName());
  }, []);

  useEffect(() => {
    setRoomId(id);
  }, [id]);

  useEffect(() => {
    if (roomId && username && tokens.clientToken && tokens.refreshToken) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [roomId, username, tokens]);

  const onDisconnected = (reason: string) => {
    setTokens({ clientToken: '', refreshToken: '' });

    if (
      reason !== 'user_initiated' &&
      optionalFeatures.isAutoReconnectEnabled &&
      reconnectCount <= MAX_RECONNECT_TIME
    ) {
      setReconnectCount((count) => count + 1);
      sendNotification({ body: `${reconnectCount} - Auto reconnecting...` });
      joinRoom();
    }
  };

  const joinRoom = async () => {
    if (clientToken && refreshToken) {
      setTokens({
        clientToken,
        refreshToken,
      });

      return;
    }

    const response = await fetch('/api/client_token', {
      method: 'POST',
      body: JSON.stringify({
        room_id: roomId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      setTokens({
        clientToken: data.token,
        refreshToken: data.refresh_token,
      });
    }
  };

  const onClickJoin = async () => {
    saveItem(USERNAME_KEY, username);
    const hasAudioPermission = await checkAudioBrowserPermission();
    if (hasAudioPermission) {
      joinRoom();
    } else {
      setError(MediaDeviceErrors.mediaBlocked);
    }
  };

  const checkAudioBrowserPermission = async () => {
    const result = await window?.navigator?.mediaDevices
      ?.getUserMedia({
        audio: true,
      })
      .then((stream) => {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
        return true;
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          return false;
        }
      });

    return result;
  };

  return (
    <Fragment>
      <Head>
        <title>Join Video Room</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Main align='center' justify='center' background='light-2'>
        <Toaster />

        <TelnyxMeetContext.Provider
          value={{
            audioInputDeviceId,
            audioOutputDeviceId,
            videoInputDeviceId,
            setAudioInputDeviceId,
            setAudioOutputDeviceId,
            setVideoInputDeviceId,
            isAudioTrackEnabled,
            isVideoTrackEnabled,
            setIsAudioTrackEnabled,
            setIsVideoTrackEnabled,
            sendNotification,
            networkMetrics,
            setNetworkMetrics,
            unreadMessages,
            optionalFeatures,
            isVideoPlaying,
            setIsVideoPlaying,
          }}
        >
          {error && (
            <ErrorDialog onClose={() => setError(undefined)} error={error} />
          )}
          {roomId && isReady ? (
            <Room
              roomId={roomId}
              tokens={tokens}
              context={{
                id: generateId(),
                username,
              }}
              onDisconnected={onDisconnected}
            />
          ) : (
            <GridPreviewContainer>
              <MediaPreview />
              <JoinRoom
                roomId={roomId || ''}
                username={username}
                updateUsername={setUsername}
                updateRoomId={setRoomId}
                updateTokens={setTokens}
                clientToken={clientToken}
                refreshToken={refreshToken}
                onClickJoin={onClickJoin}
              />
            </GridPreviewContainer>
          )}
        </TelnyxMeetContext.Provider>
      </Main>
    </Fragment>
  );
}

Rooms.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
  }),
};
