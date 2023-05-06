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
    if (
      req.body &&
      req.body.video_room_id &&
      req.body.video_room_context &&
      req.body.to
    ) {
      try {
        const response = await fetch(
          `${process.env.TELNYX_CALL_CONTROL_API_HOST}/dial_out`,
          {
            method: 'POST',
            body: JSON.stringify({
              video_room_id: req.body.video_room_id,
              video_room_context: JSON.stringify(req.body.video_room_context),
              to: req.body.to,
            }),
            headers: {
              'Content-Type': 'application/json',
              request_id: requestId,
            },
          }
        );

        const { data } = await response.json();

        if (response.ok) {
          res.status(200).json(data);
        } else {
          notify(`${response.status}: Failed to dial out`);
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
    notify(`request_id: ${requestId} - 405: Failed to dial out`);

    res.setHeader('Allow', 'POST');
    res.status(405).end();
  }
}
