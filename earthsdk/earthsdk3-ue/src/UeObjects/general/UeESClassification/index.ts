import { ESClassification } from "earthsdk3";
import { UeESGeoVector } from "../../base";
import { ESUeViewer } from "../../../ESUeViewer";
import { createNextAnimateFrameEvent } from "xbsj-base";
export class UeESClassification extends UeESGeoVector<ESClassification> {
    static readonly type = this.register('ESUeViewer', ESClassification.type, this);
    constructor(sceneObject: ESClassification, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const update = () => {
            let fillStyle = ESClassification.defaults.fillStyle
            try {
                fillStyle = { ...(sceneObject.fillStyle ?? ESClassification.defaults.fillStyle) };
            } catch (e) {
                console.error('ESClassification fillStyle 属性类型错误!', e)
                fillStyle = { ...ESClassification.defaults.fillStyle }
            }
            fillStyle.materialParams = JSON.stringify(fillStyle.materialParams);
            viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    filled: sceneObject.filled ?? ESClassification.defaults.filled,
                    fillStyle: fillStyle
                }
            })
        };
        const updateEvent = this.dv(createNextAnimateFrameEvent(
            sceneObject.fillStyleChanged,
            sceneObject.filledChanged,
        ));

        this.d(updateEvent.don(update));
        this.d(sceneObject.createdEvent.don(update));
    }
}
