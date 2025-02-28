import * as Cesium from 'cesium';
import { cesiumFixGoogleEarth } from './cesiumFixGoogleEarth';
function _getCesiumVersion() {
    // @ts-ignore
    const v = Cesium.VERSION as string;
    return v.split('.').map(e => parseInt(e));
}
let cesiumVersion: number[] | undefined;
export function getCesiumVersion() {
    if (!cesiumVersion) {
        cesiumVersion = _getCesiumVersion();
    }
    return cesiumVersion;
}
export function fixGoogleEarth() {
    const v = getCesiumVersion();
    if (v[0] === 1 && v[1] >= 92) {
        cesiumFixGoogleEarth(Cesium);
    } else {
        console.warn(`don't need to fixGoogleEarth, cesium version is ${v.join('.')}`);
    }
}