
import { ESSunshineAnalysis } from "earthsdk3";
import { ESUeViewer } from '../../../ESUeViewer';
import { UeESGeoPolygon } from '../UeESGeoPolygon';
export class UeESSunshineAnalysis extends UeESGeoPolygon<ESSunshineAnalysis> {
    static override readonly type = this.register('ESUeViewer', ESSunshineAnalysis.type, this);
    constructor(sceneObject: ESSunshineAnalysis, ueViewer: ESUeViewer) {
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
        this.d(sceneObject.stopEvent.don(() => {
            viewer.callUeFunc({
                f: "Stop",
                p: {
                    id: sceneObject.id
                }
            })
        }))
    }
}
