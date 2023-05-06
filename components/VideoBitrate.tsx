import React, { useState, useEffect } from 'react';
import { Box, Text } from 'grommet';
import { Participant, Stream } from '@telnyx/video';

import { TelnyxRoom } from 'hooks/room';

function VideoBitrate({
  participant,
  stream,
  getStatsForParticipantStream,
}: {
  participant: Participant;
  stream: Stream;
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
}) {
  const [bitrate, setBitrate] = useState(0);
  const [currentBytesReceived, setCurrentBytesReceived] = useState(0);
  const [previousBytesReceived, setPreviousBytesReceived] = useState(0);

  useEffect(() => {
    if (!stream.isVideoEnabled) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const stats = await getStatsForParticipantStream(
          participant.id,
          stream.key
        );

        let inboundRTPVideo: any;

        if (stats['receivers'] && stats['receivers']['video']) {
          inboundRTPVideo = stats['receivers']['video'];

          Object.keys(inboundRTPVideo).forEach((item) => {
            const hasVideoStream = item.match(/RTCInboundRTPVideoStream/gim);
            if (hasVideoStream) {
              setCurrentBytesReceived(inboundRTPVideo[item]['bytesReceived']);
            }
          });
        }
      } catch (error) {
        clearInterval(interval);
        setBitrate(0);
        setCurrentBytesReceived(0);
        setPreviousBytesReceived(0);
        throw error;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [participant, stream, getStatsForParticipantStream]);

  useEffect(() => {
    if (previousBytesReceived === currentBytesReceived) {
      return;
    }

    setBitrate(8 * (currentBytesReceived - previousBytesReceived));
    setPreviousBytesReceived(currentBytesReceived);
  }, [previousBytesReceived, currentBytesReceived]);

  return (
    <Box style={{ position: 'absolute', right: 0, bottom: 0 }}>
      <Box
        direction='row'
        align='center'
        justify='between'
        background={{ color: 'dark-1', opacity: 'medium' }}
        margin='xxsmall'
        pad='xxsmall'
        round='xxsmall'
        width='106px'
      >
        <Text color='status-disabled' size='xsmall'>
          Video:
        </Text>
        <Text color='status-disabled' size='xsmall'>
          {stream.isVideoEnabled ? Math.floor(bitrate / 1000) : 0} kbps
        </Text>
      </Box>
    </Box>
  );
}

export { VideoBitrate };
