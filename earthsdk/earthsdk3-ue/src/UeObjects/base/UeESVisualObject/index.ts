import { ESVisualObject } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { calcFlyToParamCallFunc, flyInCallFunc, flyToCallFunc } from "../../../ESUeViewer";
import { UeESSceneObject } from "../UeESSceneObject";
export class UeESVisualObject<T extends ESVisualObject = ESVisualObject> extends UeESSceneObject<T> {
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) return;

        this.d(sceneObject.flyToEvent.don((duration) => {
            flyToCallFunc(viewer, sceneObject.id, duration)
        }));
        this.d(sceneObject.flyInEvent.don((duration) => {
            flyInCallFunc(viewer, sceneObject.id, sceneObject.flyInParam?.position, sceneObject.flyInParam?.rotation, (duration ?? 1))
        }));

        this.d(sceneObject.calcFlyToParamEvent.don(() => {
            calcFlyToParamCallFunc(viewer, sceneObject.id)
        }));
        this.d(sceneObject.calcFlyInParamEvent.don(() => {
            const cameraInfo = ueViewer.getCurrentCameraInfo();
            if (!cameraInfo) return;
            const { position, rotation } = cameraInfo;
            sceneObject.flyInParam = { position, rotation, flyDuration: 1 };
        }));

        this.d(ueViewer.propChanged.don((info) => {
            if (info.objId !== sceneObject.id) return
            Object.keys(info.props).forEach(key => {
                const prop = info.props[key] === null ? undefined : info.props[key]
                // @ts-ignore
                sceneObject[key] = prop
            });
        }));

    }
}
