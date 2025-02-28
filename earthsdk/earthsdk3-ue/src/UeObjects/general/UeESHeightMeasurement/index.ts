import { ESHeightMeasurement } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESGeoVector } from "../../../UeObjects/base";

export class UeESHeightMeasurement extends UeESGeoVector<ESHeightMeasurement> {
    static readonly type = this.register('ESUeViewer', ESHeightMeasurement.type, this);
    constructor(sceneObject: ESHeightMeasurement, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
