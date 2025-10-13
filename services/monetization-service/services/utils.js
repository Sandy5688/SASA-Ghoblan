export const getCurrentHour = () => new Date().getHours();

export const isGeoMatch = (geoTarget, userGeo) => {
  return geoTarget.includes(userGeo);
};

export const randomPick = arr => arr[Math.floor(Math.random() * arr.length)];
