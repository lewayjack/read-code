import { ESUeViewer } from '../../../ESUeViewer';
import { ESVolumeMeasurement } from "earthsdk3";
import { UeESGeoPolygon } from '../UeESGeoPolygon';

export class UeESVolumeMeasurement extends UeESGeoPolygon<ESVolumeMeasurement> {
    static override readonly type = this.register('ESUeViewer', ESVolumeMeasurement.type, this);
    constructor(sceneObject: ESVolumeMeasurement, ueViewer: ESUeViewer) {
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
        this.d(sceneObject.clearEvent.don(() => {
            viewer.callUeFunc({
                f: 'Clear',
                p: {
                    id: sceneObject.id
                }
            })
        }))
    }
}
