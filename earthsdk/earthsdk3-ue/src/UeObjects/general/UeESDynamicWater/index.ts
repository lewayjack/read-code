
import { ESDynamicWater } from "earthsdk3";
import { ESUeViewer } from '../../../ESUeViewer';
import { UeESLocalPolygon } from '../UeESLocalPolygon';

export class UeESDynamicWater extends UeESLocalPolygon<ESDynamicWater> {
    static override readonly type = this.register('ESUeViewer', ESDynamicWater.type, this);
    constructor(sceneObject: ESDynamicWater, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
