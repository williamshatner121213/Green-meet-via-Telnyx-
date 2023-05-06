import { Participant, Room } from '@telnyx/video';
import { Button, TextInput } from 'grommet';
import { Send } from 'grommet-icons';
import { TelnyxRoom } from 'hooks/room';

import React, { MouseEventHandler, useEffect } from 'react';
import Draggable from 'react-draggable';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: absolute;
  bottom: 10%;
  left: 40%;
  background-color: white;
  width: 400px;
  height: 500px;
  z-index: 1000;
  color: #000;
  border-radius: 4px;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  box-shadow: 2px 2px 5px #cdcdcd;
`;

const MessageWrapper = styled.div<{ isLocal: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.isLocal ? 'flex-end' : 'flex-start')};
  margin: 8px 15px;
`;

const MessageContainer = styled.div<{ isLocal: boolean }>`
  border-radius: 7.5px;
  max-width: 95%;
  color: #111b21;
  background-color: ${(props) => (props.isLocal ? '#d9fdd3' : '#DADADA')};
  padding: 6px 7px 8px 9px;
`;

const MessageSender = styled.div`
  display: inline-flex;
  max-width: 100%;
  font-size: 12.8px;
  font-weight: 500;
`;

export const Chat = ({
  sendMessage,
  messages,
  onClose,
  localParticipant,
}: {
  sendMessage: Room['sendMessage'];
  onClose: MouseEventHandler<HTMLButtonElement>;
  messages: TelnyxRoom['messages'];
  localParticipant: Participant;
}) => {
  const [value, setValue] = React.useState('');
  const contentMessageRef = React.useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (value && value.length > 0) {
      await sendMessage({
        payload: value,
        type: 'text',
      });
      setValue('');
    }
  };

  useEffect(() => {
    if (contentMessageRef.current && messages.length > 0) {
      contentMessageRef.current.scrollTop =
        contentMessageRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <Draggable bounds='body' handle='#chat-header'>
      <Wrapper>
        <div
          id='chat-header'
          style={{
            backgroundColor: '#b5a4a4',
            display: 'flex',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'grab',
          }}
        >
          <button
            style={{
              marginLeft: 5,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            x
          </button>
          <h4
            style={{
              fontWeight: 500,
              textAlign: 'center',
              margin: 0,
              padding: '5px 0px',
            }}
          >
            Chat
          </h4>
          <hr style={{ margin: 0, padding: 0 }}></hr>
        </div>
        <div
          style={{
            display: 'block',
            width: 400,
            wordWrap: 'break-word',
            overflowY: 'auto',
          }}
          id='messages'
          ref={contentMessageRef}
        >
          {messages && messages?.length > 0
            ? messages.map(({ from, fromUsername, message }, key) => {
                const isLocalParticipant = localParticipant.id === from;

                return (
                  <MessageWrapper key={key} isLocal={isLocalParticipant}>
                    <MessageContainer isLocal={isLocalParticipant}>
                      <MessageSender>
                        <span
                          style={{
                            fontWeight: 900,
                            fontSize: 12,
                            color: !isLocalParticipant ? '#7D4CDB' : '#000',
                          }}
                        >
                          {isLocalParticipant ? 'Me' : fromUsername}
                        </span>
                      </MessageSender>
                      <div>
                        <span style={{ color: 'black' }}>
                          {message.payload}
                        </span>
                      </div>
                    </MessageContainer>
                  </MessageWrapper>
                );
              })
            : null}
        </div>
        <hr style={{ margin: 0, padding: 0 }}></hr>
        <div style={{ display: 'flex' }}>
          <TextInput
            focusIndicator={false}
            style={{
              height: '100%',
              outline: 'none',
              boxShadow: 'none',
              wordWrap: 'break-word',
              overflowY: 'auto',
            }}
            placeholder='Type message here...'
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button
            style={{ borderRadius: 4 }}
            margin={'none'}
            icon={<Send color='brand' />}
            onClick={handleSendMessage}
          />
        </div>
      </Wrapper>
    </Draggable>
  );
};
