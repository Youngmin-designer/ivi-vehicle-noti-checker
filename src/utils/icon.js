export function getIconUrl(iconFileName) {
  if (!iconFileName) return '';
  // iconFileName이 "ad"로 오든 "ad.svg"로 오든 대응
  const file = iconFileName.endsWith('.svg') ? iconFileName : `${iconFileName}.svg`;
  return `${import.meta.env.BASE_URL}icon_svg/${file}`;
}
