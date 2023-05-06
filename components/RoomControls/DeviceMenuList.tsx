import { MenuList } from 'components/MenuList';

type DeviceMenuListProps = {
  kind: 'audio_input' | 'video_input' | 'audio_output';
  devices: Array<{ id: string; label: string }>;
  selectedDeviceId?: string;
  handleDeviceChange: (
    kind: 'audio_input' | 'video_input' | 'audio_output',
    deviceId: string
  ) => void;
};

export function DeviceMenuList({
  kind,
  devices = [],
  selectedDeviceId,
  handleDeviceChange,
}: DeviceMenuListProps) {
  const currentDeviceId = selectedDeviceId;

  let label = '';
  switch (kind) {
    case 'audio_input':
      label = 'mic';
      break;
    case 'audio_output':
      label = 'output';
      break;
    case 'video_input':
      label = 'camera';
      break;
    default:
      throw new Error('Unknown device type!');
  }

  const devicesFormatted = devices.map((item) => ({
    label: item.label,
    value: item.id,
  }));

  return (
    <MenuList
      title={`Change ${label}`}
      data={devicesFormatted}
      onChange={(item) => handleDeviceChange(kind, item.value)}
      disabled={devices.length < 2}
      selectedValue={currentDeviceId}
      icon={false}
      itemsIconOptions={{
        gap: 'small', // gap between icon and text
        reverse: true, // icon on right
      }}
    ></MenuList>
  );
}
