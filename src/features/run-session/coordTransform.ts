const PI = Math.PI;
const AXIS = 6378245.0;
const ECCENTRICITY = 0.006693421622965943;

export function wgs84ToGcj02(latitude: number, longitude: number) {
  if (isOutsideChina(latitude, longitude)) {
    return { latitude, longitude };
  }

  const deltaLat = transformLatitude(longitude - 105.0, latitude - 35.0);
  const deltaLon = transformLongitude(longitude - 105.0, latitude - 35.0);
  const radLat = (latitude / 180.0) * PI;
  const sinLat = Math.sin(radLat);
  const magic = 1 - ECCENTRICITY * sinLat * sinLat;
  const sqrtMagic = Math.sqrt(magic);
  const adjustedLat =
    latitude + ((deltaLat * 180.0) / (((AXIS * (1 - ECCENTRICITY)) / (magic * sqrtMagic)) * PI));
  const adjustedLon = longitude + ((deltaLon * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI));

  return {
    latitude: adjustedLat,
    longitude: adjustedLon,
  };
}

function isOutsideChina(latitude: number, longitude: number) {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271;
}

function transformLatitude(longitude: number, latitude: number) {
  let result =
    -100.0 +
    2.0 * longitude +
    3.0 * latitude +
    0.2 * latitude * latitude +
    0.1 * longitude * latitude +
    0.2 * Math.sqrt(Math.abs(longitude));

  result +=
    ((20.0 * Math.sin(6.0 * longitude * PI) + 20.0 * Math.sin(2.0 * longitude * PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(latitude * PI) + 40.0 * Math.sin((latitude / 3.0) * PI)) * 2.0) / 3.0;
  result +=
    ((160.0 * Math.sin((latitude / 12.0) * PI) + 320 * Math.sin((latitude * PI) / 30.0)) * 2.0) / 3.0;

  return result;
}

function transformLongitude(longitude: number, latitude: number) {
  let result =
    300.0 +
    longitude +
    2.0 * latitude +
    0.1 * longitude * longitude +
    0.1 * longitude * latitude +
    0.1 * Math.sqrt(Math.abs(longitude));

  result +=
    ((20.0 * Math.sin(6.0 * longitude * PI) + 20.0 * Math.sin(2.0 * longitude * PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(longitude * PI) + 40.0 * Math.sin((longitude / 3.0) * PI)) * 2.0) / 3.0;
  result +=
    ((150.0 * Math.sin((longitude / 12.0) * PI) + 300.0 * Math.sin((longitude / 30.0) * PI)) * 2.0) / 3.0;

  return result;
}
