import { useEffect, useRef, useState, useContext } from 'react';
import {
  initialize,
  Room,
  State,
  Participant,
  Stream,
  Message,
} from '@telnyx/video';

import { DebugContext } from 'contexts/DebugContext';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

interface Props {
  roomId: string;
  tokens: {
    clientToken: string;
    refreshToken: string;
  };
  context: {};
  callbacks?: {
    onConnected?: () => void;
    onDisconnected?: (reason: string) => void;
    onParticipantJoined?: (
      participantId: Participant['id'],
      state: State
    ) => void;
  };
}

const TOKEN_TTL = 50;

export type TelnyxRoom = Room & {
  state: State;
  dominantSpeakerId?: Participant['id'];
  presenter?: Participant;
  messages: Array<{
    from: Participant['id'];
    fromUsername: string;
    message: Message;
    recipients: Array<Participant['id']> | null;
  }>;
  participantsByActivity: ReadonlySet<Participant['id']>;
  getWebRTCStatsForStream: (
    participantId: Participant['id'],
    key: Stream['key']
  ) => Promise<{
    senders: {
      audio?: {};
      video?: {};
    };
    receivers: {
      audio?: {};
      video?: {};
    };
  }>;
};

export const useRoom = ({
  roomId,
  tokens,
  context,
  callbacks,
}: Props): TelnyxRoom | undefined => {
  const [_, setDebugState] = useContext(DebugContext);
  const {
    sendNotification,
    setNetworkMetrics,
    unreadMessages,
    optionalFeatures,
    setIsVideoPlaying,
  } = useContext(TelnyxMeetContext);
  const roomRef = useRef<Room>();
  const [state, setState] = useState<State>();
  const [clientToken, setClientToken] = useState<string>(tokens.clientToken);

  const [presenter, setPresenter] = useState<Participant>();
  const [participantsByActivity, setParticipantsByActivity] = useState<
    Set<Participant['id']>
  >(new Set());
  const [dominantSpeakerId, setDominantSpeakerId] =
    useState<Participant['id']>();

  const [messages, _setMessages] = useState<TelnyxRoom['messages']>([]);

  const messagesRef = useRef(messages);
  const setMessages = (data: any) => {
    messagesRef.current = messagesRef.current.concat({
      from: data.from,
      fromUsername: data.fromUsername,
      message: data.message,
      recipients: data.recipients,
    });

    _setMessages(messagesRef.current);
  };

  const connectAndJoinRoom = async () => {
    try {
      roomRef.current = await initialize({
        roomId,
        clientToken,
        context: JSON.stringify(context),
        logLevel: 'DEBUG',
        enableMessages: true,
      });
    } catch (error) {
      sendNotification({ body: (error as Error).message });
      typeof callbacks?.onDisconnected === 'function' &&
        callbacks.onDisconnected('network_error');
    }

    // failed to initialize don't proceed further
    if (!roomRef.current) {
      return;
    }

    setState(roomRef.current.getState());
    setDebugState(roomRef.current.getState());

    roomRef.current.on('state_changed', (value) => {
      setState(value);
      setDebugState(value);
    });

    roomRef.current.on('connected', (state) => {
      setParticipantsByActivity((value) => {
        return new Set([
          roomRef.current!.getLocalParticipant().id,
          ...state.participants.keys(),
        ]);
      });
      state.streams.forEach((stream) => {
        if (stream.key === 'presentation') {
          setPresenter(state.participants.get(stream.participantId));
        }

        if (
          stream.participantId === roomRef.current!.getLocalParticipant().id
        ) {
          return;
        }

        roomRef.current!.addSubscription(stream.participantId, stream.key, {
          audio: true,
          video: true,
        });
      });
      typeof callbacks?.onConnected === 'function' && callbacks.onConnected();

      if (
        optionalFeatures.isNetworkMetricsEnabled &&
        state.participants.size > 0 &&
        roomRef.current!.getLocalParticipant().id
      ) {
        const participantIds: Array<string> = [];

        state.participants.forEach((item) => {
          participantIds.push(item.id);
        });

        roomRef.current!.enableNetworkMetricsReport(participantIds);
      }
    });

    roomRef.current.on('disconnected', (reason, state) => {
      if (reason === 'network_error') {
        sendNotification({
          body: 'network_error - Check your network connection',
        });
      }

      if (reason === 'user_initiated') {
        sendNotification({
          body: 'user_initiated - Disconnect method executed by user',
        });
      }

      if (reason === 'timed_out') {
        sendNotification({
          body: 'timed_out - Reached out timeout limit to connect',
        });
      }

      setParticipantsByActivity(new Set());
      typeof callbacks?.onDisconnected === 'function' &&
        callbacks.onDisconnected(reason);
    });

    roomRef.current.on('participant_joined', (participantId, state) => {
      if (
        optionalFeatures.isNetworkMetricsEnabled &&
        state.participants.size > 0
      ) {
        const participantIds: Array<string> = [];
        state.participants.forEach((item) => {
          participantIds.push(item.id);
        });

        roomRef.current!.enableNetworkMetricsReport(participantIds);
      }

      setParticipantsByActivity((value) => {
        return new Set([
          roomRef.current!.getLocalParticipant().id,
          ...value,
          participantId,
        ]);
      });

      typeof callbacks?.onParticipantJoined === 'function' &&
        callbacks.onParticipantJoined(participantId, state);
    });

    roomRef.current.on(
      'participant_leaving',
      (participantId, reason, state) => {
        if (reason === 'kicked') {
          if (state.localParticipantId === participantId) {
            sendNotification({
              body: 'You got kicked from the room by the moderator!',
            });
          } else {
            const context = JSON.parse(
              state.participants.get(participantId).context
            );

            sendNotification({
              body: `${
                context.username ? context.username : participantId
              } has been kicked by the moderator!`,
            });
          }
        }

        if (
          optionalFeatures.isNetworkMetricsEnabled &&
          state.participants.size > 0
        ) {
          roomRef.current!.disableNetworkMetricsReport([participantId]);
        }
      }
    );

    roomRef.current.on('participant_left', (participantId, state) => {
      if (presenter?.id === participantId) {
        setPresenter(undefined);
      }

      if (dominantSpeakerId === participantId) {
        setDominantSpeakerId(undefined);
      }

      setParticipantsByActivity((value) => {
        value.delete(participantId);
        return new Set([roomRef.current!.getLocalParticipant().id, ...value]);
      });

      if (
        optionalFeatures.isNetworkMetricsEnabled &&
        state.participants.size > 0
      ) {
        roomRef.current!.disableNetworkMetricsReport([participantId]);
      }
    });

    roomRef.current.on('stream_published', (participantId, key, state) => {
      if (key === 'presentation') {
        setPresenter(state.participants.get(participantId));
      }

      if (participantId === roomRef.current!.getLocalParticipant().id) {
        return;
      }

      roomRef.current!.addSubscription(participantId, key, {
        audio: true,
        video: true,
      });
    });

    roomRef.current.on('stream_unpublished', (participantId, key, state) => {
      if (key === 'presentation') {
        setPresenter(undefined);
      }

      if (dominantSpeakerId === participantId && key === 'self') {
        setDominantSpeakerId(undefined);
      }
    });

    roomRef.current.on('track_enabled', (participantId, key, kind, state) => {
      if (kind === 'video') {
        setIsVideoPlaying(true);
      }
    });
    roomRef.current.on('track_disabled', (participantId, key, kind, state) => {
      if (kind === 'video') {
        setIsVideoPlaying(false);
      }
    });

    roomRef.current.on('track_censored', (participantId, key, kind, state) => {
      if (kind === 'audio') {
        if (state.localParticipantId === participantId) {
          sendNotification({
            body: `Your audio from "${key}" stream has been censored by the moderator`,
          });
        } else {
          const context = JSON.parse(
            state.participants.get(participantId).context
          );

          sendNotification({
            body: `${
              context.username ? context.username : participantId
            }'s audio from "${key}" stream has been censored by the moderator`,
          });
        }
      }
    });

    roomRef.current.on(
      'track_uncensored',
      (participantId, key, kind, state) => {
        if (kind === 'audio') {
          if (state.localParticipantId === participantId) {
            sendNotification({
              body: `Your audio from "${key}" stream has been uncensored by the moderator`,
            });
          } else {
            const context = JSON.parse(
              state.participants.get(participantId).context
            );

            sendNotification({
              body: `${
                context.username ? context.username : participantId
              }'s audio from "${key}" stream has been uncensored by the moderator`,
            });
          }
        }
      }
    );

    roomRef.current.on('audio_activity', (participantId, key) => {
      if (
        (!key || key === 'self') &&
        participantId !== roomRef.current!.getLocalParticipant().id
      ) {
        console.log(`${participantId} is speaking`);
        setDominantSpeakerId(participantId);
        setParticipantsByActivity((value) => {
          return new Set([
            roomRef.current!.getLocalParticipant().id,
            participantId,
            ...value,
          ]);
        });
      }
    });

    roomRef.current.on(
      'subscription_started',
      (participantId, key, state) => {}
    );
    roomRef.current.on(
      'subscription_reconfigured',
      (participantId, key, state) => {}
    );
    roomRef.current.on('subscription_ended', (participantId, key, state) => {});
    roomRef.current.on(
      'message_received',
      (participantId, message, recipients, state) => {
        const participant = state.participants.get(participantId);
        const fromUsername = JSON.parse(participant.context).username;

        if (!unreadMessages.current) {
          unreadMessages.current = [];
        }

        const newMessages = unreadMessages.current.concat({
          from: participantId,
          fromUsername,
          message,
          recipients,
        });

        unreadMessages.current = newMessages;

        setMessages({
          from: participantId,
          fromUsername,
          message,
          recipients,
        });
      }
    );

    roomRef.current.on('network_metrics_report', (networkMetrics) => {
      console.debug('network_metrics_report', networkMetrics);
      setNetworkMetrics(networkMetrics);
    });

    try {
      await roomRef.current.connect();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (!roomRef.current) {
      connectAndJoinRoom();
    }

    // Note: we only want this to run once. Probably there's a better way to structure this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.debug(participantsByActivity);
  }, [participantsByActivity]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDominantSpeakerId(undefined);
    }, 5000);

    return () => {
      clearTimeout(timerId);
    };
  }, [dominantSpeakerId]);

  useEffect(() => {
    const updateClientToken = async () => {
      if (state?.status === 'connected') {
        await roomRef.current!.updateClientToken(clientToken);
      }
    };

    updateClientToken();
  }, [clientToken, state?.status]);

  useEffect(() => {
    const refreshTokenIntervalId = setInterval(async () => {
      if (state?.status !== 'connected') {
        return;
      }

      const response = await fetch('/api/refresh_client_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClientToken(data.token);
      }
    }, (TOKEN_TTL - 20) * 1000);

    return () => {
      clearInterval(refreshTokenIntervalId);
    };
  }, [tokens.refreshToken, state?.status]);

  useEffect(() => {
    console.debug('[video-meet] React State: ', state);
  }, [state]);

  return roomRef.current && state
    ? {
        ...roomRef.current,
        state,
        dominantSpeakerId,
        presenter,
        participantsByActivity,
        messages,
      }
    : undefined;
};
