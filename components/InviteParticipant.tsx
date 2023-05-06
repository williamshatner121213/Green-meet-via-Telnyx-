import { useState, useEffect, useContext, useCallback } from 'react';
import { Box, Button, Heading, Text, TextInput, Spinner } from 'grommet';
import { FormClose as FormCloseIcon } from 'grommet-icons';

import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

import { generateId } from 'utils/helpers';
import {
  parsePhoneNumberToE164,
  parsePhoneNumberToInternational,
} from 'utils/parsePhoneNumber';

export default function InviteParticipant({
  roomId,
  setIsInviteParticipantVisible,
  invitedParticipants,
  setInvitedParticipants,
}: {
  roomId: string;
  setIsInviteParticipantVisible: React.Dispatch<React.SetStateAction<boolean>>;
  invitedParticipants: Map<string, boolean>;
  setInvitedParticipants: React.Dispatch<
    React.SetStateAction<Map<string, boolean>>
  >;
}) {
  const { sendNotification } = useContext(TelnyxMeetContext);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneNumberFocus = () => {
    if (!phoneNumber) {
      setPhoneNumber('+');
    }
  };

  const handlePhoneNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const number = event.target.value;
    const parsedNumber = parsePhoneNumberToE164(number);

    setPhoneNumber(parsedNumber);
  };

  const handleResolveInvite = useCallback(
    ({
      invitedParticipant,
      message,
    }: {
      invitedParticipant: string;
      message: string;
    }) => {
      setIsLoading(false);
      setInvitedParticipants((invitedParticipantsObject) => {
        invitedParticipantsObject.delete(invitedParticipant);

        return new Map([...invitedParticipantsObject]);
      });
      sendNotification({ body: message });
    },
    [setInvitedParticipants, sendNotification]
  );

  const handleSendInvite = async () => {
    setIsLoading(true);

    setInvitedParticipants((invitedParticipantsObject) => {
      return new Map([...invitedParticipantsObject, [phoneNumber, false]]);
    });

    const response = await fetch('/api/dial_out', {
      method: 'POST',
      body: JSON.stringify({
        video_room_id: roomId,
        video_room_context: {
          id: generateId(),
          username: phoneNumber,
        },
        to: phoneNumber,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      handleResolveInvite({
        invitedParticipant: phoneNumber,
        message: 'Request to invite participant failed.',
      });
    }
  };

  useEffect(() => {
    // Before disabling the send invitation button, double check if the phone
    // number has a pattern similar to the E.164, and a length between 10 and
    // 15 digits.
    const isPhoneNumberValid = /^\+?[1-9]\d{9,14}$/.test(phoneNumber);

    if (isPhoneNumberValid) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const participantJoinTimeoutId = setTimeout(() => {
      handleResolveInvite({
        invitedParticipant: phoneNumber,
        message: `No answer from phone number "${phoneNumber}".`,
      });
    }, 30000);

    const hasInvitedParticipantJoined = invitedParticipants.get(phoneNumber);

    if (hasInvitedParticipantJoined) {
      handleResolveInvite({
        invitedParticipant: phoneNumber,
        message: `${phoneNumber} has entered the room.`,
      });
      clearTimeout(participantJoinTimeoutId);
    }

    return () => {
      clearTimeout(participantJoinTimeoutId);
    };
  }, [phoneNumber, isLoading, invitedParticipants, handleResolveInvite]);

  return (
    <Box background='#2a2a2a' round='xsmall' fill>
      <Box direction='row' align='center' justify='between' pad='small'>
        <Heading margin='none' size='1.2em' level={2}>
          Send Invite
        </Heading>

        <Box>
          <Button
            icon={<FormCloseIcon />}
            onClick={() => setIsInviteParticipantVisible(false)}
            plain
          />
        </Box>
      </Box>

      <Box pad={{ horizontal: 'small' }} fill overflow='auto' gap='medium'>
        <Text>
          Add participants to this room by entering their phone number.
        </Text>

        <TextInput
          type='tel'
          value={parsePhoneNumberToInternational(phoneNumber)}
          onFocus={handlePhoneNumberFocus}
          placeholder='+1 201 555 0123'
          onChange={handlePhoneNumberChange}
          autoComplete='off'
          disabled={isLoading}
        />

        {isLoading ? (
          <Box align='center'>
            <Spinner align='center' color='white' />
          </Box>
        ) : (
          <Button
            label='Send invite'
            onClick={handleSendInvite}
            size='small'
            primary
            disabled={isButtonDisabled}
          />
        )}
      </Box>
    </Box>
  );
}
