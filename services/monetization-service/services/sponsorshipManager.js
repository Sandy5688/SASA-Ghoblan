import { randomPick, isGeoMatch } from "./utils.js";

export const pickSponsoredSegment = (segments, userGeo) => {
  const valid = segments.filter(s => isGeoMatch(s.geo || [], userGeo));
  if (valid.length === 0) return null;
  return randomPick(valid);
};
