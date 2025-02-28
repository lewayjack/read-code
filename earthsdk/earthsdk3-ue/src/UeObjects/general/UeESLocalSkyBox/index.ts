import { ESLocalSkyBox } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";
export class UeESLocalSkyBox extends UeESObjectWithLocation<ESLocalSkyBox> {
    static readonly type = this.register('ESUeViewer', ESLocalSkyBox.type, this);
    constructor(sceneObject: ESLocalSkyBox, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
