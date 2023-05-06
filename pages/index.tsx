import { Fragment } from 'react';
import Head from 'next/head';
import { Box, Button, Main } from 'grommet';

import AppHeader from 'components/AppHeader';

export default function Home() {
  return (
    // NOTE room ID is hardcoded in backend right now
    <Fragment>
      <Head>
        <title>Video Room</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Main background='light-2'>
        <AppHeader />

        <Box align='center' pad='large' gap='medium'>
          <Box
            background={{ color: 'status-error', opacity: 'weak' }}
            round='xsmall'
            pad='small'
          >
            This is a demo app for Telnyx Video SDK
          </Box>

          <Button
            data-testid='btn-select-room'
            href='/rooms'
            label='Join A Room'
          />
        </Box>
      </Main>
    </Fragment>
  );
}
