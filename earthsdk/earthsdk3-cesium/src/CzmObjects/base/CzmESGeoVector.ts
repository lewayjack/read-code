
import { ESGeoVector } from "earthsdk3";
import { CzmESVisualObject } from "./CzmESVisualObject";
import { ESCesiumViewer } from "../../ESCesiumViewer";
export class CzmESGeoVector<T extends ESGeoVector = ESGeoVector> extends CzmESVisualObject<T> {
    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn('viewer is undefined!');
            return;
        }
    }
}
