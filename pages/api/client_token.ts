import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as generatedId } from 'uuid';

import { notify } from 'lib/bugsnag';
import { transformFetchErrorToBugsnag } from 'utils/helpers';

type Data = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const requestId = generatedId();

  if (req.method === 'POST') {
    if (req.body && req.body.room_id) {
      try {
        const response = await fetch(
          `${process.env.TELNYX_API_HOST}/rooms/${req.body.room_id}/actions/generate_join_client_token`,
          {
            method: 'POST',
            body: JSON.stringify({
              refresh_token_ttl_secs: 3600,
              token_ttl_secs: 60,
            }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
              request_id: requestId,
            },
          }
        );

        const { data } = await response.json();

        if (response.ok) {
          res.status(200).json(data);
        } else {
          notify(`${response.status}: Failed to generate client token`);
          const errorMessage =
            (data && data.message) || (response && response.statusText);

          transformFetchErrorToBugsnag(
            requestId,
            errorMessage,
            response.status
          );

          res.status(response.status).json(response.statusText);
        }
      } catch (error) {
        notify(`request_id: ${requestId} - ${error}`);

        res.status(500).end();
      }
    }
  } else {
    notify(`request_id: ${requestId} - 405: Failed to generate client token`);

    res.setHeader('Allow', 'POST');
    res.status(405).end();
  }
}
