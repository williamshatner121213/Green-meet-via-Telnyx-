import styled, { css } from 'styled-components';
import { Box, BoxExtendedProps } from 'grommet';

const VIDEO_BG_COLOR = '#111';

export const FeedContainer = styled.div<{
  isPresentation: boolean;
  showAudioActivityIndicator: boolean;
}>`
  ${({ isPresentation, showAudioActivityIndicator }) => css`
    position: relative;
    overflow: hidden;
    height: ${isPresentation ? '100%' : 'unset'};
    padding-top: ${isPresentation
      ? 'unset'
      : `${(9 / 16) * 100}%`}; // 56.25% - 16:9 Aspect Ratio
    background-color: ${VIDEO_BG_COLOR};
    border-width: 3px;
    border-style: solid;
    border-color: ${showAudioActivityIndicator ? 'yellow' : '#1b1b1b'};
  `}
`;

export const FeedHeader = styled.div<{ showBlackBackgroundColor: boolean }>`
  ${({ showBlackBackgroundColor }) => css`
    position: absolute;
    top: 0px;
    z-index: 2;
    width: 100%;
    height: 100%;
    background-color: ${showBlackBackgroundColor ? VIDEO_BG_COLOR : ''};
  `}
`;

export const VideoContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

export const FeedFooter = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 2;
`;

export const FeedParticipantNameCenter = styled(Box)<
  BoxExtendedProps & {
    showBlackBackgroundColor: boolean;
  }
>`
  ${({ showBlackBackgroundColor }) => css`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    background-color: ${showBlackBackgroundColor ? VIDEO_BG_COLOR : ''};
  `}
`;

export const FeedSpinner = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
`;
