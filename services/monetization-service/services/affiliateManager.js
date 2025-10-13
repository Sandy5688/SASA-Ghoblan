import { randomPick, isGeoMatch } from "./utils.js";

export const generateAffiliateSlot = (config, userGeo) => {
  const activeSlots = config.slots.filter(slot => {
    const geoMatch = isGeoMatch(slot.geo || [], userGeo);
    const hour = new Date().getHours();
    const timeMatch = !slot.time || (hour >= slot.time.start && hour <= slot.time.end);
    return geoMatch && timeMatch;
  });

  if (activeSlots.length === 0) return null;

  return randomPick(activeSlots);
};
