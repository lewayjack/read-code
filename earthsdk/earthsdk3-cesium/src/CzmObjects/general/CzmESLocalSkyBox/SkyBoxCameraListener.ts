import { ESLocalSkyBox, getDistancesFromPositions } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable } from "xbsj-base";
import { SkyBoxComponent } from "./SkyBoxComponent";

export class SkyBoxCameraListener extends Destroyable {
    constructor(sceneObject: ESLocalSkyBox, czmViewer: ESCesiumViewer, SkyBoxComponents: SkyBoxComponent[]) {
        super();
        if (!czmViewer.viewer) return;
        let isFirstFollow = true;
        let lastCameraParam: {
            position: [number, number, number];
            rotation: [number, number, number];
        } | undefined;
        this.dispose(czmViewer.viewer.scene.preUpdate.addEventListener(() => {
            changeOpacityAndPosition()
        }))
        function changeOpacityAndPosition() {
            if (!czmViewer.viewer?.camera) return;
            const cameraParam = czmViewer.getCameraInfo();
            if (cameraParam != undefined && (lastCameraParam == undefined
                || lastCameraParam.position[0] != cameraParam.position[0]
                || lastCameraParam.position[1] != cameraParam.position[1]
                || lastCameraParam.position[2] != cameraParam.position[2]
                || lastCameraParam.rotation[0] != cameraParam.rotation[0]
                || lastCameraParam.rotation[1] != cameraParam.rotation[1]
                || lastCameraParam.rotation[2] != cameraParam.rotation[2])) {
                lastCameraParam = cameraParam;
                let distance = getDistancesFromPositions(
                    [sceneObject.position, lastCameraParam.position],
                    'NONE'
                )[0];
                const OpacityFactor = distance / (sceneObject.size / 2 * sceneObject.autoOpacityFactor);
                if (sceneObject.autoFollow) {

                    sceneObject.position = lastCameraParam.position;
                    if (isFirstFollow) {
                        isFirstFollow = false;
                        SkyBoxComponents.forEach(item => {
                            // 隐藏
                            item.changeOpacity(1);
                        })
                    }
                } else {
                    SkyBoxComponents.forEach(item => {
                        item.changeOpacity(OpacityFactor);
                    })
                }
            }
        }
        changeOpacityAndPosition();
    }
}
