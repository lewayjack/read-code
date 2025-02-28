import { ESSurfaceAreaMeasurement } from "earthsdk3";
import { UeESGeoPolygon } from "../UeESGeoPolygon";
import { ESUeViewer } from "../../../ESUeViewer";
export class UeESSurfaceAreaMeasurement extends UeESGeoPolygon<ESSurfaceAreaMeasurement> {
    static override readonly type = this.register('ESUeViewer', ESSurfaceAreaMeasurement.type, this);
    constructor(sceneObject: ESSurfaceAreaMeasurement, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this.d(sceneObject.startEvent.don(() => {
            viewer.callUeFunc({
                f: 'Start',
                p: {
                    id: sceneObject.id
                }
            })
        }))
    }
}
