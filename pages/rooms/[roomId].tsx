import { useRouter } from 'next/router';

import Rooms from './';

const RoomId = () => {
  const router = useRouter();
  const queryParameters = router.query as {
    roomId: string;
    client_token: string;
    refresh_token: string;
  };

  return (
    <>
      <Rooms
        id={queryParameters.roomId}
        clientToken={queryParameters.client_token}
        refreshToken={queryParameters.refresh_token}
      />
    </>
  );
};

export default RoomId;
