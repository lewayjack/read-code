import { ESPolygonFence } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESGeoVector } from "../../../UeObjects/base";

export class UeESPolygonFence extends UeESGeoVector<ESPolygonFence> {
    static readonly type = this.register('ESUeViewer', ESPolygonFence.type, this);

    constructor(sceneObject: ESPolygonFence, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
