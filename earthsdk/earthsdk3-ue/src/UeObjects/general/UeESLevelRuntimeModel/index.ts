import { ESLevelRuntimeModel } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";

export class UeESLevelRuntimeModel extends UeESObjectWithLocation<ESLevelRuntimeModel> {
    static readonly type = this.register('ESUeViewer', ESLevelRuntimeModel.type, this);
    constructor(sceneObject: ESLevelRuntimeModel, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
