
import { ESPolygonWithHole } from "earthsdk3";
import { ESUeViewer } from '../../../ESUeViewer';
import { UeESGeoPolygon } from '../UeESGeoPolygon';

export class UeESPolygonWithHole extends UeESGeoPolygon<ESPolygonWithHole> {
    static override readonly type = this.register('ESUeViewer', ESPolygonWithHole.type, this);
    constructor(sceneObject: ESPolygonWithHole, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
