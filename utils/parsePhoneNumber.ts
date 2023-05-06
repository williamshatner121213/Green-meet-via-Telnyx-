import parsePhoneNumber from 'libphonenumber-js';

export const parsePhoneNumberToE164 = (number: string) => {
  const phoneNumber = number.replace(/[\s]/g, '');
  // To help parse the phone number, ensure that the plus (+) sign is in place.
  const parsedNumber = parsePhoneNumber(
    number.charAt(0) === '+' ? phoneNumber : `+${phoneNumber}`
  );

  return parsedNumber ? parsedNumber.format('E.164') : phoneNumber;
};

export const parsePhoneNumberToInternational = (number: string) => {
  // To help parse the phone number, ensure that the plus (+) sign is in place.
  const parsedNumber = parsePhoneNumber(
    number.charAt(0) === '+' ? number : `+${number}`
  );

  return parsedNumber ? parsedNumber.formatInternational() : number;
};
