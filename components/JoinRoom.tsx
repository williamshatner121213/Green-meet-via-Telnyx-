import React, { useState } from 'react';
import { Box, Button, TextInput } from 'grommet';

interface Props {
  roomId: string;
  username: string;
  updateRoomId?: React.Dispatch<React.SetStateAction<string | undefined>>;
  updateUsername: React.Dispatch<React.SetStateAction<string>>;
  updateTokens: React.Dispatch<
    React.SetStateAction<{ clientToken: string; refreshToken: string }>
  >;
  clientToken: string;
  refreshToken: string;
  onClickJoin: () => void;
}

const JoinRoom = ({
  roomId,
  username,
  updateRoomId,
  updateUsername,
  onClickJoin,
}: Props) => {
  return (
    <>
      <Box
        pad='small'
        gap='medium'
        style={{
          justifySelf: 'center',
        }}
      >
        <Box
          background={{ color: 'white', opacity: 'weak' }}
          round='xsmall'
          pad='small'
        >
          Enter the Room UUID and choose a name for yourself
        </Box>

        <TextInput
          data-testid='input-room-uuid'
          value={roomId}
          onChange={(e) => {
            if (typeof updateRoomId === 'function') {
              updateRoomId(e.target.value);
            }
          }}
          placeholder={'Room UUID'}
        />

        <TextInput
          data-testid='input-username'
          value={username}
          onChange={(e) => {
            updateUsername(e.target.value);
          }}
          placeholder='Your name'
        />

        <Button
          data-testid='btn-join-room'
          primary
          disabled={!roomId || !username}
          label='Join room'
          onClick={onClickJoin}
        />
      </Box>
    </>
  );
};

export default JoinRoom;
