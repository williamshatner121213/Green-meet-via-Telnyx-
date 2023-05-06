import { Box, Button } from 'grommet';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const breakpointMedium = 1023;

export const RightBoxMenu = styled(Box)`
  @media (max-width: ${breakpointMedium}px) {
    display: none;
  }
  align-items: center;
  justify-content: center;
`;

export const ControllerBox = styled(Box)`
  @media (max-width: ${breakpointMedium}px) {
    display: none;
  }
`;

export const LeaveButton = styled(Button)`
  margin-right: 6px;
`;

export const FontAwesomeIconStyled = styled(FontAwesomeIcon)`
  @media (max-width: ${breakpointMedium}px) {
    font-size: 25px;
  }
`;

export const Bubble = styled.div`
  background-color: #8ab4f8;
  border-color: #202124;
  right: -3px;
  position: absolute;
  top: -4px;
  border-radius: 50%;
  border: 2px solid white;
  height: 18px;
  width: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
