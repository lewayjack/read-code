
import { ESPipeline } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESGeoLineString } from "../UeESGeoLineString";

export class UeESPipeline extends UeESGeoLineString<ESPipeline> {
    static override readonly type = this.register('ESUeViewer', ESPipeline.type, this);
    constructor(sceneObject: ESPipeline, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
