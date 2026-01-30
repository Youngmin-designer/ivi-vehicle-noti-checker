// 흰색 아이콘 목록 (미리보기에서 검정 배경 필요)
export const WHITE_ICONS = [
  'alert_triangle.svg',
  'master_warning_multiple.svg',
  'parking_brake.svg',
];

// 아이콘 목록 (icon_svg 폴더)
export const ICON_LIST = [
  'ad.svg',
  'afs.svg',
  'airbag_malfunction.svg',
  'alert_triangle.svg',
  'antilock_brake_system_malfunction-na.svg',
  'antilock_brake_system_malfunction.svg',
  'auto_high_beam_blue.svg',
  'auto_high_beam_gray.svg',
  'auto_hold_green.svg',
  'auto_hold_yellow.svg',
  'autoparking.svg',
  'battery_low.svg',
  'battery_temp_cooling_canceled.svg',
  'battery_temp_cooling_compelete.svg',
  'battery_temp_cooling_progressing.svg',
  'battery_temp_cooling_scheduled.svg',
  'battery_temp_heating_canceled.svg',
  'battery_temp_heating_complete.svg',
  'battery_temp_heating_progressing.svg',
  'battery_temp_heating_scheduled.svg',
  'battery_temp_preconditioning_scheduled.svg',
  'battery_temp_preconditioning.svg',
  'diesel_preheat.svg',
  'door_trunk_open.svg',
  'dpf_gpf.svg',
  'driver_attention_warning.svg',
  'e_call.svg',
  'electronic_charging_condition.svg',
  'electronic_stability_control_system_malfunction.svg',
  'electronic_stability_control_system_off.svg',
  'electronic_stability_control_system_on.svg',
  'engine_coolant_temperature.svg',
  'engine_malfuction.svg',
  'engine_oil_pressure.svg',
  'epb.svg',
  'ev_system_malfunction.svg',
  'front_fog_lamp.svg',
  'h2_leak.svg',
  'h2_sensor.svg',
  'headlamp_blue.svg',
  'headlamp_green.svg',
  'immobilizer.svg',
  'inforamtion.svg',
  'led_head_light_malfunction.svg',
  'low_tyre_pressure.svg',
  'master_warning_multiple.svg',
  'master_warning.svg',
  'mdps_red.svg',
  'mdps_yellow.svg',
  'parking_brake_na.svg',
  'parking_brake.svg',
  'power_down.svg',
  'press_brake.svg',
  'rbs_malfunction.svg',
  'rear_fog_lamp.svg',
  'scr.svg',
  'seat_belt.svg',
  'tail_lamp.svg',
  'takeover.svg',
];

// 폰트 목록
export const FONT_LIST = [
  { id: 'Asta Sans OTF', name: 'Asta Sans OTF (Structured)' },
  { id: 'Noto Sans KR', name: 'Noto Sans KR (Asteon)' },
];

// 레벨 목록
export const LEVEL_LIST = [
  'information',
  'warning',
  'urgent',
  'critical',
];

// 레벨별 필수 항목 설정
// required: 필수, optional: 선택, disabled: 비활성화
export const LEVEL_REQUIRED_FIELDS = {
  information: {
    title: 'optional',
    description: 'required',
  },
  warning: {
    title: 'required',
    description: 'optional',
  },
  urgent: {
    title: 'required',
    description: 'optional',
  },
  critical: {
    title: 'disabled',
    description: 'required',
  },
};

// 레벨별 스타일 설정
export const LEVEL_STYLES = {
  information: {
    background: '#ffffff',
    borderRadius: 0,
    border: '2px solid #DADADA',
    textColor: '#000000',
    iconColor: null, // 원본 색상 유지
    layout: 'horizontal',
    iconSize: 48,
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
    iconTextGap: 24,
    textAreaWidth: 390,
    hasTitle: true,
  },
  warning: {
    background: '#ffffff',
    borderRadius: 0,
    border: '2px solid #FF8A00',
    textColor: '#000000',
    iconColor: null,
    layout: 'horizontal',
    iconSize: 48,
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
    iconTextGap: 24,
    textAreaWidth: 390,
    hasTitle: true,
  },
  urgent: {
    background: '#9F3228',
    borderRadius: 0,
    border: 'none',
    textColor: '#ffffff',
    iconColor: '#ffffff',
    layout: 'horizontal',
    iconSize: 48,
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
    iconTextGap: 24,
    textAreaWidth: 390,
    hasTitle: true,
  },
  critical: {
    background: '#9F3228',
    borderRadius: 0,
    border: 'none',
    textColor: '#ffffff',
    iconColor: '#ffffff',
    layout: 'vertical',
    iconSize: 64,
    padding: { top: 32, right: 24, bottom: 24, left: 24 },
    iconTextGap: 16,
    textAreaWidth: 462, // 510 - 24*2 = 462
    hasTitle: false,
    description: {
      fontSize: 30,
      fontWeight: 600,
      lineHeight: 'auto',
      maxLines: 4,
    },
  },
};
