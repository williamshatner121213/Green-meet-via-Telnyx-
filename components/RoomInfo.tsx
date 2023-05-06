import { Fragment } from 'react';
import { Box, Heading } from 'grommet';

export default function RoomInfo({ roomId }: { roomId: string }) {
  return (
    <Fragment>
      <Box
        pad={{ horizontal: 'small' }}
        direction='row'
        align='center'
        justify='between'
        height='60px'
      >
        <Heading margin='none' size='1.2em'>
          {roomId}
        </Heading>
      </Box>
    </Fragment>
  );
}
