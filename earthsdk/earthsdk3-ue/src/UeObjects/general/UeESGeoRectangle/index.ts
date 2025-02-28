import { ESGeoRectangle } from "earthsdk3";
import { UeESGeoVector } from "../../../UeObjects";
import { ESUeViewer } from "../../../ESUeViewer";
export class UeESGeoRectangle<T extends ESGeoRectangle = ESGeoRectangle> extends UeESGeoVector<T> {
    static readonly type = this.register<ESGeoRectangle, ESUeViewer>('ESUeViewer', ESGeoRectangle.type, this);
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
