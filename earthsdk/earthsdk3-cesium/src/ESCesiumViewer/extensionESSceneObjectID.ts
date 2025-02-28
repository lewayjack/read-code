import * as Cesium from 'cesium';
import { createGuid } from 'xbsj-base';

export default function extensionESSceneObjectID() {
    Object.keys(Cesium).forEach(key => {
        //@ts-ignore
        if (Cesium[key].prototype) {
            //@ts-ignore
            Object.defineProperty(Cesium[key].prototype, 'ESSceneObjectID', {
                writable: true,
                enumerable: true,
                value: createGuid()
            })
        }
    })
}