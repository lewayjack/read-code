import { ESDirectionMeasurement } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESGeoVector } from "../../../UeObjects/base";

export class UeESDirectionMeasurement extends UeESGeoVector<ESDirectionMeasurement> {
    static readonly type = this.register('ESUeViewer', ESDirectionMeasurement.type, this);
    constructor(sceneObject: ESDirectionMeasurement, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
