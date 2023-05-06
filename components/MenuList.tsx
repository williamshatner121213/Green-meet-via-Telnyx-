import { Box, Menu, Text } from 'grommet';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
const breakpointMedium = 1023;

const FontAwesomeIconStyled = styled(FontAwesomeIcon)`
  @media (max-width: ${breakpointMedium}px) {
    font-size: 25px;
  }
`;

export function MenuList({
  title,
  data,
  onChange,
  disabled = false,
  size = 'medium',
  selectedValue = '',
  icon,
  itemsIconOptions,
}: {
  title: string;
  data: Array<{ label: string; value: string }>;
  onChange: (item: { label: string; value: string }) => void;
  disabled?: boolean;
  size?: string;
  selectedValue?: string;
  icon?: React.ReactNode;
  itemsIconOptions?: {
    gap?: string; // gap between icon and text
    reverse?: boolean;
  };
}) {
  if (!data || data.length < 1) {
    return null;
  }

  return (
    <Menu
      size={size}
      label={title}
      items={data.map((item) => ({
        label: item.label,
        icon: (
          <Box>
            {item.value === selectedValue && (
              <Text color='accent-1'>
                <FontAwesomeIconStyled icon={faCheck} fixedWidth />
              </Text>
            )}
          </Box>
        ),
        // TODO give some sort UI feedback that device was successfully changed
        onClick: () => {
          onChange(item);
        },
        ...itemsIconOptions,
      }))}
      disabled={disabled}
      icon={icon ? icon : false}
    ></Menu>
  );
}
