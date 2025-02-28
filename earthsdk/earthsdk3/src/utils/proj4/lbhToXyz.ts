// https://blog.csdn.net/mrbaolong/article/details/109142612
import proj4 from "proj4";
// proj4.defs('WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
// proj4.defs('GEOCENTRIC', "+proj=geocent +datum=WGS84");
const lbhToXyzProj = proj4("+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees", "+proj=geocent +datum=WGS84");

export function lbhToXyz(lbh: [number, number, number]) {
    const xyz = lbhToXyzProj.forward(lbh);
    return xyz;
}

export function xyzToLbh(xyz: [number, number, number]) {
    const lbh = lbhToXyzProj.inverse(xyz);
    return lbh;
}

// 经纬度到Web Mercator

// proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs");
const webMercator = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs";
const lbhToWebMercProj = proj4("+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees", webMercator);

export function lbhToWebMerc(lbh: [number, number, number]) {
    // forward的参数不能是lbh，否则它会把lbh给改成只有2个元素！
    const wm = lbhToWebMercProj.forward([lbh[0], lbh[1]]);
    return [wm[0], wm[1], lbh[2]];
}

export function webMercToLbh(wm: [number, number, number]) {
    const lbh = lbhToWebMercProj.inverse([wm[0], wm[1]]);
    return [lbh[0], lbh[1], wm[2]];
}
