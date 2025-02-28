import { ESGeoJson } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESVisualObject } from "../../../UeObjects/base";
export class UeESGeoJson extends UeESVisualObject<ESGeoJson> {
    static readonly type = this.register('ESUeViewer', ESGeoJson.type, this);
    constructor(sceneObject: ESGeoJson, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this.d(sceneObject.flyToFeatureIndexEvent.don((index, duration) => {
            viewer.callUeFunc({
                f: 'flyToFeatureIndex',
                p: {
                    id: sceneObject.id,
                    index,
                    duration
                }
            })
        }))
        this.d(sceneObject.flyToFeatureEvent.don((key, value, duration) => {
            viewer.callUeFunc({
                f: 'flyToFeature',
                p: {
                    id: sceneObject.id,
                    key,
                    value,
                    duration
                }
            })
        }))
    }
}
