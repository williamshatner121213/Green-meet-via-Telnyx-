import React, { useContext, useMemo } from 'react';

import { TelnyxRoom } from 'hooks/room';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';
import AudioTrack from 'components/AudioTrack';
import { Participant } from '@telnyx/video';

export default function RoomAudio({
  participants,
  streams,
  useMixedAudioForOutput,
  mixedAudioTrack,
}: {
  participants: TelnyxRoom['state']['participants'];
  streams: TelnyxRoom['state']['streams'];
  useMixedAudioForOutput: boolean;
  mixedAudioTrack?: MediaStreamTrack;
}) {
  const { audioOutputDeviceId } = useContext(TelnyxMeetContext);

  const audioTracks = useMemo(() => {
    if (useMixedAudioForOutput) {
      return [];
    }

    const audioTracks: Array<{ id: string; track: MediaStreamTrack }> = [];

    participants.forEach((participant: Participant) => {
      if (participant.origin === 'local') {
        return;
      }

      const selfStreamId = participant.streams['self'];
      if (selfStreamId) {
        const stream = streams.get(selfStreamId);
        if (!stream) {
          return;
        }

        if (stream.audioTrack) {
          audioTracks.push({
            id: stream.id,
            track: stream.audioTrack,
          });
        }
      }
    });

    return audioTracks;
  }, [streams, participants, useMixedAudioForOutput]);

  const roomAudio = useMemo(() => {
    if (useMixedAudioForOutput) {
      if (mixedAudioTrack) {
        return (
          <AudioTrack
            id='mixedAudio'
            audioTrack={mixedAudioTrack}
            audioOutputDeviceId={audioOutputDeviceId}
          />
        );
      }

      return null;
    }

    return audioTracks.map(({ id, track }) => {
      return (
        <AudioTrack
          key={id}
          id={id}
          audioTrack={track}
          audioOutputDeviceId={audioOutputDeviceId}
        />
      );
    });
  }, [
    audioTracks,
    useMixedAudioForOutput,
    mixedAudioTrack,
    audioOutputDeviceId,
  ]);

  return <>{roomAudio}</>;
}
