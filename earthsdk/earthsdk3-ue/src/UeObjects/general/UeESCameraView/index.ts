// import { ESCameraView } from '../../objs';
// // import { flyInCallFunc, resetWithCurrentCameraCallFunc } from '../../../base/UeViewer/CallUeFuncs';
// import { flyInCallFunc, resetWithCurrentCameraCallFunc } from 'xbsj-xe2/dist-node/xe2-ue-objects';
// import { UeViewer } from '../../../base';
// import { UeESObjectWithLocation } from '../../../base';
// import { ObjResettingWithEvent } from 'xbsj-xe2/dist-node/xe2-utils';
// import { UeCameraHelper } from './UeCameraHelper';

import { ESCameraView } from "earthsdk3";
import { UeESObjectWithLocation } from "../../base";
import { ESUeViewer, resetWithCurrentCameraCallFunc } from "../../../ESUeViewer";
import { flyInCallFunc } from "../../../ESUeViewer";

export class UeESCameraView extends UeESObjectWithLocation<ESCameraView> {
    static readonly type = this.register('ESUeViewer', ESCameraView.type, this);
    constructor(sceneObject: ESCameraView, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        this.dispose(sceneObject.flyInEvent.don(duration => {
            flyInCallFunc(viewer, sceneObject.id, sceneObject.position, sceneObject.rotation, duration)
        }))

        this.dispose(sceneObject.resetWithCurrentCameraEvent.don(() => {
            resetWithCurrentCameraCallFunc(viewer, sceneObject.id)
        }));

        this.dispose(sceneObject.captureEvent.don((x, y) => {
            const str = ueViewer.capture(x, y)
            str.then((res) => { if (res) sceneObject.thumbnail = res })
        }));
    }
}
