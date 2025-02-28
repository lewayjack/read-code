import { ESViewer } from "../ESViewer";
import { ESObjectsManager } from "./index";

export function handleCameraInfo(objm: ESObjectsManager, viewer: ESViewer) {
    const cameraInfo = objm._lastCameraInfo;
    if (cameraInfo) {
        const dispos = viewer.viewerChanged.don((e) => {
            if (!e || !cameraInfo) return;
            const { position, rotation } = cameraInfo;
            viewer.flyIn(position, rotation, 0);
            objm._lastCameraInfo = undefined;
            dispos();
        });
    }
}


export const syncOnceOtherViewer = (viewer: ESViewer, otherViewer: ESViewer) => {
    const reactProps = ESViewer.createCommonProps();
    try {
        Object.keys(reactProps).forEach(item => {
            //@ts-ignore
            viewer[item] = otherViewer[item]
        })
    } catch (error) {
        console.warn(error)
    }
}
