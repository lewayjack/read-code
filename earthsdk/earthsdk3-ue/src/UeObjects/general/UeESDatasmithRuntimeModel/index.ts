import { ESDatasmithRuntimeModel } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";

export class UeESDatasmithRuntimeModel extends UeESObjectWithLocation<ESDatasmithRuntimeModel> {
    static readonly type = this.register('ESUeViewer', ESDatasmithRuntimeModel.type, this);
    constructor(sceneObject: ESDatasmithRuntimeModel, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
