export const USERNAME_KEY = 'username';
export const USER_PREFERENCE_AUDIO_ENABLED = 'audioEnabled';
export const USER_PREFERENCE_VIDEO_ENABLED = 'videoEnabled';
export const USER_PREFERENCE_BACKGROUND_TYPE = 'background_type';

export const saveItem = (key: string, value: string) => {
  if (!key || !value) {
    throw new Error('key and value must be provided');
  }

  if (!window || !window.localStorage) {
    console.warn('localStorage not supported');
  }
  localStorage.setItem(key, value);
};

export const getItem = (key: string) => {
  if (!key) {
    throw new Error('No key provided');
  }

  if (!window || !window.localStorage) {
    console.warn('localStorage not supported');
  }

  return localStorage.getItem(key) || undefined;
};

export const saveItemSessionStorage = (key: string, value: string) => {
  if (!key || !value) {
    throw new Error('key and value must be provided');
  }

  if (!window || !window.sessionStorage) {
    console.warn('sessionStorage not supported');
  }
  sessionStorage.setItem(key, value);
};

export const getItemSessionStorage = (key: string) => {
  if (!key) {
    throw new Error('No key provided');
  }

  if (!window || !window.sessionStorage) {
    console.warn('sessionStorage not supported');
  }

  return sessionStorage.getItem(key) || undefined;
};
