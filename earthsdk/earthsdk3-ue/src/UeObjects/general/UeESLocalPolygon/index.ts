
import { ESLocalPolygon } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESLocalVector2D } from "../../../UeObjects/base";

export class UeESLocalPolygon<T extends ESLocalPolygon = ESLocalPolygon> extends UeESLocalVector2D<T> {
    static readonly type = this.register<ESLocalPolygon, ESUeViewer>('ESUeViewer', ESLocalPolygon.type, this);
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

    }
}
