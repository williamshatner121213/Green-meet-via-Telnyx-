import { MouseEventHandler } from 'react';
import { Box, Button, ButtonProps, Text } from 'grommet';
import { FontAwesomeIconStyled } from './styles';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

type ControlButtonProps = {
  dataTestId: string;
  disabled: boolean;
  showEnabledIcon: boolean;
  enabledIcon: {
    icon: IconProp;
    label: string;
  };
  disabledIcon: {
    icon: IconProp;
    label: string;
  };
  onClick: MouseEventHandler<HTMLAnchorElement> &
    MouseEventHandler<HTMLButtonElement>;
} & Pick<ButtonProps, 'size'>;

export function ControlButton({
  dataTestId,
  size = 'medium',
  disabled,
  onClick,
  enabledIcon,
  disabledIcon,
  showEnabledIcon,
  ...props
}: ControlButtonProps) {
  return (
    <Button
      data-testid={dataTestId}
      size={size}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <Box align='center' gap='xsmall'>
        <Box>
          <Text
            size='40.3px' // kinda hacky, make fa icon 48px
            color={showEnabledIcon ? 'accent-1' : 'status-error'}
          >
            <FontAwesomeIconStyled
              icon={showEnabledIcon ? enabledIcon.icon : disabledIcon.icon}
              fixedWidth
            />
          </Text>
        </Box>
        <Text size='xsmall' color='light-6'>
          {showEnabledIcon ? enabledIcon.label : disabledIcon.label}
        </Text>
      </Box>
    </Button>
  );
}
