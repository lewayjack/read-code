import { UeESObjectWithLocation } from '../UeESObjectWithLocation';
import { ESUeViewer } from '../../../ESUeViewer';
import { ESJFillStyle, ESJPointStyle, ESJStrokeStyle, ESLocalVector } from "earthsdk3";
export class UeESLocalVector<T extends ESLocalVector = ESLocalVector> extends UeESObjectWithLocation<T> {
    static override propValFuncs = {
        ...UeESObjectWithLocation.propValFuncs,
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

    }
}
