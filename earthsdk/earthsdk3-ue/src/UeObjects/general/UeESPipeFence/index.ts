import { ESPipeFence } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESGeoVector } from "../../../UeObjects/base";
export class UeESPipeFence extends UeESGeoVector<ESPipeFence> {
    static readonly type = this.register('ESUeViewer', ESPipeFence.type, this);
    constructor(sceneObject: ESPipeFence, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
