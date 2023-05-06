import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as generatedId } from 'uuid';

import { notify } from 'lib/bugsnag';

import { transformFetchErrorToBugsnag } from 'utils/helpers';

type Data = Array<{}>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const requestId = generatedId();
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${process.env.TELNYX_API_HOST}/rooms`, {
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          request_id: requestId,
        },
      });

      const { data } = await response.json();

      if (response.ok) {
        res.status(200).json(data);
      } else {
        notify(`${response.status}: Failed to get rooms`);

        const errorMessage =
          (data && data.message) || (response && response.statusText);

        transformFetchErrorToBugsnag(requestId, errorMessage, response.status);

        res.status(response.status).json(data);
      }
    } catch (error) {
      notify(`request_id: ${requestId} - ${error}`);

      res.status(500).end();
    }
  } else {
    notify(`request_id: ${requestId} - 405: Failed to get rooms`);

    res.setHeader('Allow', 'GET');
    res.status(405).end();
  }
}
