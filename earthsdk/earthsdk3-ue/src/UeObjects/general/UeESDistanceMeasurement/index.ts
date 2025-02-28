import { ESDistanceMeasurement } from "earthsdk3";
import { createNextAnimateFrameEvent } from "xbsj-base";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESGeoVector } from "../../base";
export class UeESDistanceMeasurement extends UeESGeoVector<ESDistanceMeasurement> {
    static readonly type = this.register('ESUeViewer', ESDistanceMeasurement.type, this);
    constructor(sceneObject: ESDistanceMeasurement, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const update = () => {
            let strokeStyle;
            try {
                strokeStyle = { ...(sceneObject.strokeStyle ?? ESDistanceMeasurement.defaults.strokeStyle) };
            } catch (e) {
                console.error('ESDistanceMeasurement strokeStyle 属性类型错误!', e)
                strokeStyle = { ...ESDistanceMeasurement.defaults.strokeStyle }
            }
            viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    strokeStyle
                }
            })
        };
        const updateEvent = this.dv(createNextAnimateFrameEvent(
            sceneObject.strokeStyleChanged,
        ));
        this.d(updateEvent.don(update));
        this.d(sceneObject.createdEvent.don(update));
    }
}
