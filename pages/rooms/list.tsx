import { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import { Box, DataTable, Main, Text } from 'grommet';

import AppHeader from 'components/AppHeader';

type Data = {
  id: string;
  unique_name: string;
  record_audio: boolean;
  record_video: boolean;
};

export default function Home() {
  const [isDoneLoadingRooms, setIsDoneLoadingRooms] = useState(false);
  const [rooms, setRooms] = useState([]);

  const loadRooms = async () => {
    const response = await fetch('/api/rooms');
    if (response.ok) {
      const data = await response.json();
      setRooms(data);
    }
    setIsDoneLoadingRooms(true);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    // NOTE room ID is hardcoded in backend right now
    <Fragment>
      <Head>
        <title>Video Room</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Main background='light-2'>
        <AppHeader />

        <Box align='center' pad='large'>
          {isDoneLoadingRooms && rooms.length === 0 && (
            <Box
              background={{ color: 'status-error', opacity: 'weak' }}
              round='xsmall'
              pad='small'
            >
              <Text color='status-error'>
                No rooms found. Are you on the VPN?
              </Text>
            </Box>
          )}

          {rooms.length > 0 && (
            <DataTable
              primaryKey='id'
              columns={[
                {
                  header: 'Name',
                  property: 'unique_name',
                  size: 'medium',
                  // eslint-disable-next-line react/display-name
                  render: (datum: Data) => (
                    <Box direction='row' align='center' justify='between'>
                      <Text size='medium' weight='bold'>
                        {datum.unique_name}
                      </Text>
                    </Box>
                  ),
                },
                {
                  header: 'UUID',
                  property: 'id',
                  render: (datum: Data) => (
                    <a href={`/rooms/${datum.id}`}>{datum.id}</a>
                  ),
                },
                {
                  header: 'Max participants',
                  property: 'max_participants',
                },
                {
                  header: 'Record audio',
                  property: 'record_audio',
                  render: (datum) => (datum.record_audio ? 'Yes' : 'No'),
                },
                {
                  header: 'Record video',
                  property: 'record_video',
                  render: (datum) => (datum.record_video ? 'Yes' : 'No'),
                },
              ]}
              data={rooms}
            />
          )}
        </Box>
      </Main>
    </Fragment>
  );
}
