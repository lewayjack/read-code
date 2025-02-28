import { ESCesiumViewer } from "../../ESCesiumViewer";
import { Destroyable, JsonValue } from "xbsj-base";

export function createInnerClassFromJson<T extends Destroyable>(ObjJson: JsonValue & { type: string;[k: string]: any; }, objClass: new (czmViewer: ESCesiumViewer) => T, czmViewer: ESCesiumViewer) {
    const sceneObj = new objClass(czmViewer);
    const finalFilterKeys = ['id', 'type'];

    for (const key in ObjJson) {
        if (Object.prototype.hasOwnProperty.call(ObjJson, key)) {
            const element = ObjJson[key];
            //@ts-ignore
            if (Reflect.has(sceneObj, key) && !finalFilterKeys.includes(key))
                //@ts-ignore
                sceneObj[key] = element;
        }
    }
    return sceneObj;
}