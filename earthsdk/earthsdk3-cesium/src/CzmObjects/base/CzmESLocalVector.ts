import { ESLocalVector } from "earthsdk3";
import { CzmESObjectWithLocation } from "./CzmESObjectWithLocation";
import { ESCesiumViewer } from "../../ESCesiumViewer";
export class CzmESLocalVector<T extends ESLocalVector = ESLocalVector> extends CzmESObjectWithLocation<T> {
    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn('viewer is undefined!');
            return;
        }
    }
}
