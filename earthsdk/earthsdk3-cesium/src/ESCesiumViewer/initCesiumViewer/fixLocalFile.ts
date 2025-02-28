import * as Cesium from 'cesium';
import { defaultLocalFileServer } from 'xbsj-base';

export function fixLocalFile() {
    const originFetchJson = Cesium.Resource.prototype.fetchJson;
    const originFetchArrayBuffer = Cesium.Resource.prototype.fetchArrayBuffer;

    Cesium.Resource.prototype.fetchJson = function (...args) {
        if (this.url.startsWith(`https://${defaultLocalFileServer.prefix}`)) {
            const path = this.url.substring(8);
            return defaultLocalFileServer.getJson(path);
        } else {
            return originFetchJson.call(this, ...args);
        }
    };

    Cesium.Resource.prototype.fetchArrayBuffer = function (...args) {
        if (this.url.startsWith(`https://${defaultLocalFileServer.prefix}`)) {
            const path = this.url.substring(8);
            return defaultLocalFileServer.getArrayBuffer(path).then(result => {
                if (!result) throw new Error(`result is undefined!`);
                return result;
            });
        } else {
            return originFetchArrayBuffer.call(this, ...args);
        }
    }
}
