import { ESGeoWater } from "earthsdk3";
import { ESUeViewer } from '../../../ESUeViewer';
import { UeESGeoPolygon } from '../UeESGeoPolygon';

export class UeESGeoWater extends UeESGeoPolygon<ESGeoWater> {
    static override readonly type = this.register('ESUeViewer', ESGeoWater.type, this);

    constructor(sceneObject: ESGeoWater, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
