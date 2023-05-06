import React, {
  ReactElement,
  useEffect,
  useState,
  ReactChild,
  MutableRefObject,
} from 'react';
import { Participant } from '@telnyx/video';
import styled from 'styled-components';

import { TelnyxRoom } from 'hooks/room';
import { useWindowSize } from 'hooks/windowSize';
import Feed from 'components/Feed';
import { Pagination } from 'components/Pagination';
import { VirtualBackground } from 'utils/virtualBackground';

const breakpointMedium = 1023;

const SideBar = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 347px);
  align-content: start;
  max-height: calc(100% - 54px);
  overflow: hidden;

  @media (max-width: ${breakpointMedium}px) {
    display: none;
  }
`;

function NewSideBar({ children }: { children: ReactChild }) {
  return (
    <SideBar data-testid='sidebar' key='sidebar'>
      {children}
    </SideBar>
  );
}

const NewSideBarMemo = React.memo(NewSideBar);

function ScreenSharingLayout({
  participants,
  // TODO: avoid disable line
  // eslint-disable-next-line no-unused-vars
  streams,
  participantsByActivity,
  presenter,
  dominantSpeakerId,
  getParticipantStream,
  getStatsForParticipantStream,
  dataTestId,
  virtualBackgroundCamera,
}: {
  participants: TelnyxRoom['state']['participants'];
  streams: TelnyxRoom['state']['streams']; // if this is removed, the feeds will not rerender when the streams update
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  presenter: Participant;
  dominantSpeakerId?: Participant['id'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  dataTestId: string;
  virtualBackgroundCamera: VirtualBackground['camera'];
}) {
  const USERS_PER_PAGE = 3;
  const NAVIGATION_BUTTONS_HEIGHT = 48;
  const FEED_MIN_HEIGHT = 154;

  const [maxParticipantPerPage, setMaxParticipantPerPage] =
    useState(USERS_PER_PAGE);

  const screenSize = useWindowSize();

  useEffect(() => {
    const feeds = document.getElementById('feeds');
    const feed = document.querySelectorAll('[data-id="video-feed-sidebar"]')[0];

    if (feeds) {
      let feedHeight =
        feed && feed.clientHeight ? feed.clientHeight : FEED_MIN_HEIGHT;

      const maxPerPage = Math.floor(
        (feeds.clientHeight - NAVIGATION_BUTTONS_HEIGHT) / feedHeight
      );

      if (maxPerPage > 0) {
        setMaxParticipantPerPage(maxPerPage);
      }
    }
  }, [maxParticipantPerPage, screenSize.height]);

  const participantsFeeds = [...participantsByActivity]
    .map((id) => {
      const participant = participants.get(id) as Participant | undefined;
      if (!participant) {
        return null;
      }

      return (
        <Feed
          dataId='video-feed-sidebar'
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

  return (
    <div
      id='feeds'
      data-testid={dataTestId}
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
      }}
    >
      {participantsFeeds.length > 0 ? (
        <Pagination
          viewType='screen-sharing'
          RenderComponent={NewSideBarMemo}
          data={participantsFeeds as ReactElement[]}
          dataLimit={maxParticipantPerPage}
        />
      ) : null}
      <div
        style={{
          width: '100%',
          height: '100%',
          marginLeft: 16,
        }}
      >
        <Feed
          participant={presenter}
          stream={getParticipantStream(presenter.id, 'presentation')}
          isSpeaking={false}
          getStatsForParticipantStream={getStatsForParticipantStream}
          mirrorVideo={false}
          virtualBackgroundCamera={null}
        />
      </div>
    </div>
  );
}

export default React.memo(ScreenSharingLayout);
