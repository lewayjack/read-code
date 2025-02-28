import { ESVisibilityAnalysis } from "earthsdk3";
import { UeESGeoVector } from "../../../UeObjects/base";
import { ESUeViewer } from "../../../ESUeViewer";
export class UeESVisibilityAnalysis extends UeESGeoVector<ESVisibilityAnalysis> {
    static readonly type = this.register('ESUeViewer', ESVisibilityAnalysis.type, this);
    constructor(sceneObject: ESVisibilityAnalysis, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is underfined!`);
            return;
        }
    }
}
