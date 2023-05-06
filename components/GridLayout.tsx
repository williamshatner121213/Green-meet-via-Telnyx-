import React, { ReactChild, ReactElement, useEffect } from 'react';
import { Participant } from '@telnyx/video';

import { TelnyxRoom } from 'hooks/room';
import { useWindowSize, getWindowSize } from 'hooks/windowSize';
import Feed from 'components/Feed';
import { Pagination } from 'components/Pagination';
import { VirtualBackground } from 'utils/virtualBackground';

function GridView({
  children,
  dataTestId,
  columnsQuantity,
}: {
  children: ReactChild;
  dataTestId: string;
  columnsQuantity: any;
}) {
  return (
    <div
      data-testid={dataTestId}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnsQuantity.size}, minmax(auto, 1fr))`,
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 20,
      }}
    >
      {children}
    </div>
  );
}

const GridViewMemo = React.memo(GridView);

function GridLayout({
  participants,
  // TODO: avoid disable line
  // eslint-disable-next-line no-unused-vars
  streams,
  dominantSpeakerId,
  participantsByActivity,
  getParticipantStream,
  getStatsForParticipantStream,
  dataTestId,
  virtualBackgroundCamera,
}: {
  participants: TelnyxRoom['state']['participants'];
  streams: TelnyxRoom['state']['streams']; // if this is removed, the feeds will not rerender when the streams update
  dominantSpeakerId?: Participant['id'];
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  dataTestId: string;
  virtualBackgroundCamera: VirtualBackground['camera'] | null;
}) {
  const NAVIGATION_BUTTONS_HEIGHT = 96;
  const REPORT_BUTTON_HEIGHT = 32;
  const screenSize = useWindowSize();

  const [maxParticipantPerPage, setMaxParticipantPerPage] = React.useState(2);

  useEffect(() => {
    const MAIN_FEEDS_MIN_WIDTH = 320;
    const MAIN_FEEDS_MIN_HEIGHT = 640;

    const FEED_MIN_WIDTH = 244;
    const FEED_MIN_HEIGHT = 137;

    const mainFeeds = document.getElementById('room-container');
    const mainFeedWidth = mainFeeds!.clientWidth || MAIN_FEEDS_MIN_WIDTH;
    const mainFeedHeight = mainFeeds!.clientHeight || MAIN_FEEDS_MIN_HEIGHT;
    const mainFeedsArea =
      mainFeedWidth *
      (mainFeedHeight - NAVIGATION_BUTTONS_HEIGHT - REPORT_BUTTON_HEIGHT);
    const feed = document.querySelectorAll('[data-id="video-feed-grid"]')[0];

    let feedArea;

    if (feed) {
      feedArea = feed.clientWidth * feed.clientHeight;
    } else {
      feedArea = FEED_MIN_WIDTH * FEED_MIN_HEIGHT;
    }

    const totalArea = Math.floor(mainFeedsArea / feedArea);

    if (totalArea > 0) {
      setMaxParticipantPerPage(totalArea);
    }
  }, [screenSize]);

  const feeds = [...participantsByActivity]
    .map((id) => {
      const participant = participants.get(id) as Participant | undefined;
      if (!participant) {
        return null;
      }

      return (
        <Feed
          dataId='video-feed-grid'
          key={`${participant.id}_self`}
          participant={participant}
          stream={getParticipantStream(participant.id, 'self')}
          isSpeaking={dominantSpeakerId === participant.id}
          mirrorVideo={participant.origin === 'local'}
          getStatsForParticipantStream={getStatsForParticipantStream}
          virtualBackgroundCamera={
            virtualBackgroundCamera && participant.origin === 'local'
              ? virtualBackgroundCamera
              : null
          }
        />
      );
    })
    .filter((value) => value !== null);

  const xlarge = {
    size: 5,
  };

  const large = {
    size: 4,
  };

  const medium = {
    size: 3,
  };

  const small = {
    size: 2,
  };

  const xsmall = {
    size: 1,
  };

  const resolutions: any = { xlarge, large, medium, small, xsmall };
  const columnsQuantity = screenSize
    ? resolutions[getWindowSize(screenSize?.width || 0)]
    : medium;

  const layoutProps = {
    dataTestId,
    columnsQuantity,
  };

  return (
    <div>
      {feeds.length > 0 ? (
        <Pagination
          viewType='grid'
          data={feeds as ReactElement[]}
          dataLimit={maxParticipantPerPage}
          RenderComponent={GridViewMemo}
          layoutProps={layoutProps}
        />
      ) : null}
    </div>
  );
}

export default React.memo(GridLayout);
