import { ESLocationMeasurement } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";

export class UeESLocationMeasurement extends UeESObjectWithLocation<ESLocationMeasurement> {
    static readonly type = this.register('ESUeViewer', ESLocationMeasurement.type, this);
    constructor(sceneObject: ESLocationMeasurement, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
