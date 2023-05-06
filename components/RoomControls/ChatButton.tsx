import { MouseEventHandler } from 'react';
import { Box, Button, Text } from 'grommet';
import { Chat as ChatIcon } from 'grommet-icons';
import { Bubble } from './styles';

type ChatButton = {
  onClick?: MouseEventHandler<HTMLAnchorElement> &
    MouseEventHandler<HTMLButtonElement>;
  totalUnreadMessages?: number;
  isChatBoxOpened?: boolean;
};

export function ChatButton({
  onClick,
  totalUnreadMessages = 0,
  isChatBoxOpened = false,
}: ChatButton) {
  return (
    <Button data-testid='btn-toggle-chat' size='large' onClick={onClick}>
      <Box align='center' gap='xsmall'>
        <Box style={{ position: 'relative' }}>
          {totalUnreadMessages > 0 && (
            <Bubble>
              <span
                style={{
                  fontSize: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                {totalUnreadMessages}
              </span>
            </Bubble>
          )}
          <ChatIcon
            size='large'
            color={isChatBoxOpened ? 'accent-1' : 'light-5'}
          />
        </Box>
        <Text size='xsmall' color='light-6'>
          Chat
        </Text>
      </Box>
    </Button>
  );
}
