import { ESSubmergingAnalysis } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";
export class UeESSubmergingAnalysis extends UeESObjectWithLocation<ESSubmergingAnalysis> {
    static readonly type = this.register('ESUeViewer', ESSubmergingAnalysis.type, this);
    constructor(sceneObject: ESSubmergingAnalysis, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
