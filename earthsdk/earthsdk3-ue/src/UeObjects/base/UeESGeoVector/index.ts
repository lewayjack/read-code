import { ESGeoVector, ESJFillStyle, ESJPointStyle, ESJStrokeStyle } from "earthsdk3";
import { UeESVisualObject } from "../UeESVisualObject";
import { ESUeViewer } from "../../../ESUeViewer";
import { createNextAnimateFrameEvent } from "xbsj-base";

export class UeESGeoVector<T extends ESGeoVector = ESGeoVector> extends UeESVisualObject<T> {
    static override forceUeUpdateProps = [
        ...UeESVisualObject.forceUeUpdateProps,
        'editing',
    ];

    static override propValFuncs = {
        ...UeESVisualObject.propValFuncs,
        pointStyle: (val: ESJPointStyle) => ({
            ...val,
            materialParams: JSON.stringify(val.materialParams ?? {}),
        }),
        strokeStyle: (val: ESJStrokeStyle) => ({
            ...val,
            materialParams: JSON.stringify(val.materialParams ?? {}),
        }),
        fillStyle: (val: ESJFillStyle) => ({
            ...val,
            materialParams: JSON.stringify(val.materialParams ?? {}),
        }),
    };

    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) return;

        const update = () => {
            //多发一次测试
            if (sceneObject.editing) return;
            viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    points: sceneObject.points
                }
            })
        };
        const updateEvent = this.dv(createNextAnimateFrameEvent(
            sceneObject.pointsChanged,
            sceneObject.editingChanged,
        ));
        this.d(updateEvent.don(() => { setTimeout(update, 0) }));
    }
}
