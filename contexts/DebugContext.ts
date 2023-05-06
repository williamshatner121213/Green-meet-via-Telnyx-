import React from 'react';

const DebugContext = React.createContext<
  [debugState: any, setDebugState: React.SetStateAction<any>]
>([null, () => {}]);
export { DebugContext };
