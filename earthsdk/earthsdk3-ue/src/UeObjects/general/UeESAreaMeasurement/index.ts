import { ESAreaMeasurement } from "earthsdk3";
import { UeESGeoPolygon } from "../UeESGeoPolygon";
import { ESUeViewer } from "../../../ESUeViewer";
import { createNextAnimateFrameEvent } from "xbsj-base";

export class UeESAreaMeasurement extends UeESGeoPolygon<ESAreaMeasurement> {
    static override readonly type = this.register('ESUeViewer', ESAreaMeasurement.type, this);
    constructor(sceneObject: ESAreaMeasurement, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const update = () => {
            let fillStyle = ESAreaMeasurement.defaults.fillStyle
            try {
                fillStyle = { ...(sceneObject.fillStyle ?? ESAreaMeasurement.defaults.fillStyle) };
            } catch (e) {
                console.error('ESAreaMeasurement fillStyle 属性类型错误!', e)
                fillStyle = { ...ESAreaMeasurement.defaults.fillStyle }
            }
            fillStyle.materialParams = JSON.stringify(fillStyle.materialParams);
            viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    stroked: sceneObject.stroked ?? ESAreaMeasurement.defaults.stroked,
                    fillStyle,
                    filled: sceneObject.filled ?? ESAreaMeasurement.defaults.filled,
                }
            })
            console.log(fillStyle);

        };
        const updateEvent = this.dv(createNextAnimateFrameEvent(
            sceneObject.fillStyleChanged,
            sceneObject.strokedChanged,
            sceneObject.filledChanged,
        ));
        this.d(updateEvent.don(update));
        this.d(sceneObject.createdEvent.don(update));
    }
}
