import React, { useContext } from 'react';
import { Button, Layer, Box } from 'grommet';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styled from 'styled-components';

import { DebugContext } from 'contexts/DebugContext';

const StyledLayer = styled(Layer)`
  @media only screen and (max-width: 768px) {
    justify-content: center;
  }
`;

export function ReportIssueModal() {
  const [showDialog, setShowDialog] = React.useState(false);
  const open = () => setShowDialog(true);
  const close = () => {
    setShowDialog(false);
    setIsCopied(false);
  };
  const [isCopied, setIsCopied] = React.useState(false);

  const [debugState] = useContext(DebugContext);

  const header = (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button color='dark-3' label='X' onClick={close}></Button>
    </div>
  );

  const debugReplacer = (key: any, value: any) => {
    if (value instanceof Map) {
      return Object.fromEntries(value);
    }

    if (value instanceof MediaStreamTrack) {
      // Type 'MediaStreamTrack' does not have a '[Symbol.iterator]()' method
      // that returns an iterator. Creating a mock object with some of its
      // properties is sufficient.
      return {
        contentHint: value.contentHint,
        enabled: value.enabled,
        id: value.id,
        kind: value.kind,
        label: value.label,
        muted: value.muted,
        readyState: value.readyState,
      };
    }

    return value;
  };

  const content = (
    <pre
      style={{
        backgroundColor: '#cecece',
        overflow: 'auto',
        height: 400,
      }}
    >
      <code>{JSON.stringify(debugState, debugReplacer, 2)}</code>
    </pre>
  );

  const footer = (
    <Box as='footer' gap='small' direction='row' align='center' justify='start'>
      <CopyToClipboard
        text={JSON.stringify(debugState, debugReplacer, 2)}
        onCopy={() => setIsCopied(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: 60 }}>
          <Button label='Copy' size='small' primary></Button>
          {isCopied && <p style={{ marginLeft: 20 }}>Copied</p>}
        </div>
      </CopyToClipboard>
    </Box>
  );

  if (!debugState) {
    return null;
  }

  return (
    <div>
      <Button
        style={{
          position: 'absolute',
          right: '20px',
          bottom: '100px',
          borderRadius: '10px',
          backgroundColor: '#63adfc',
          color: '#fff',
          borderColor: '#fff',
          zIndex: 4,
        }}
        onClick={open}
        label='Report issue'
        size='small'
        secondary
      ></Button>
      {showDialog && (
        <StyledLayer
          position='center'
          onClickOutside={close}
          onEsc={close}
          responsive={false}
        >
          <Box pad='medium'>
            {header}
            {content}
            {footer}
          </Box>
        </StyledLayer>
      )}
    </div>
  );
}
