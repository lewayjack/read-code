
import { EngineObject, ESGeoDiv, ESImageLabel, ESJVector3D, ESJVector4D } from "earthsdk3";
import html2canvas from "html2canvas";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import {
    calcFlyToParamCallFunc, ESUeViewer, smoothMoveCallFunc, smoothMoveOnGroundCallFunc,
    smoothMoveWithRotationCallFunc, smoothMoveWithRotationOnGroundCallFunc
} from "../../../ESUeViewer";

// 通过ESImagLabel进行显示，通过DIV进行定位和点击事件的判断
export class UeESGeoDiv extends EngineObject<ESGeoDiv> {
    static readonly type = this.register('ESUeViewer', ESGeoDiv.type, this);
    // static override combinationClass = true;
    private _imageLabel = this.dv(new ESImageLabel());

    private _hasClassDivAndPos = {} as { [key: string]: ESJVector4D };

    constructor(sceneObject: ESGeoDiv, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        // 创建ESImageLabel
        const imageLabel = this._imageLabel;
        ueViewer.add(imageLabel);
        this.d(() => ueViewer.delete(imageLabel))

        this.d(track([imageLabel, 'show'], [sceneObject, 'show']));
        this.d(track([imageLabel, 'anchor'], [sceneObject, 'anchor']));
        this.d(bind([imageLabel, 'editing'], [sceneObject, 'editing']));
        this.d(bind([imageLabel, 'position'], [sceneObject, 'position']));
        this.d(bind([imageLabel, 'rotation'], [sceneObject, 'rotation']));
        this.d(bind([imageLabel, 'flyToParam'], [sceneObject, 'flyToParam']));
        this.d(bind([imageLabel, 'flyInParam'], [sceneObject, 'flyInParam']));
        this.d(bind([imageLabel, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.d(track([imageLabel, 'scale'], [sceneObject, 'scale']));
        this.d(track([imageLabel, 'minVisibleDistance'], [sceneObject, 'minVisibleDistance']));
        this.d(track([imageLabel, 'maxVisibleDistance'], [sceneObject, 'maxVisibleDistance']));
        // 点击事件，暂时无效
        this.d(imageLabel.pickedEvent.don(pickedInfo => {
            if (sceneObject.allowPicking ?? false) {
                // sceneObject.pickedEvent.emit(new SceneObjectPickedInfo(sceneObject, pickedInfo));
                sceneObject.pickedEvent.emit(pickedInfo);
            }
        }))
        // 内部通过ESImageLable进行实现，需要重新监听
        this.d(ueViewer.widgetEvent.don((info) => {
            if (info.objId !== this._imageLabel.id) return
            const { type, add } = info;
            if (type === "leftClick") {
                const classNames = Object.keys(this._hasClassDivAndPos);
                for (let i = 0; i < classNames.length; i++) {
                    const className = classNames[i];
                    let rect = this._hasClassDivAndPos[className];
                    // 检查点击点是否与DIV元素重叠
                    if (add && add.mouseRelativePos && (add.mouseRelativePos[0] >= rect[0] && add.mouseRelativePos[0] <= rect[2] && add.mouseRelativePos[1] >= rect[1] && add.mouseRelativePos[1] <= rect[3])) {
                        // 点击点与DIV元素重叠，借用widgetEvent事件进行相应
                        add["className"] = className;
                        break;
                    }
                }
            }
            sceneObject.widgetEvent.emit({ type, add });
        }))
        this.d(sceneObject.calcFlyToParamEvent.don(() => {
            calcFlyToParamCallFunc(viewer, imageLabel.id)
        }));

        this.d(sceneObject.calcFlyInParamEvent.don(() => {
            const cameraInfo = ueViewer.getCurrentCameraInfo();
            if (!cameraInfo) return;
            const { position, rotation } = cameraInfo;
            sceneObject.flyInParam = { position, rotation, flyDuration: 1 };
        }));

        this.d(sceneObject.smoothMoveEvent.don((Destination: ESJVector3D, Time: number) => {
            smoothMoveCallFunc(viewer, imageLabel.id, Destination, Time)
        }))
        this.d(sceneObject.smoothMoveWithRotationEvent.don((Destination: ESJVector3D, NewRotation: ESJVector3D, Time: number) => {
            smoothMoveWithRotationCallFunc(viewer, imageLabel.id, Destination, NewRotation, Time)
        }))
        this.d(sceneObject.smoothMoveOnGroundEvent.don((Lon: number, Lat: number, Time: number, Ground: string) => {
            smoothMoveOnGroundCallFunc(viewer, imageLabel.id, Lon, Lat, Ground, Time)
        }))
        this.d(sceneObject.smoothMoveWithRotationOnGroundEvent.don((NewRotation: ESJVector3D, Lon: number, Lat: number, Time: number, Ground: string) => {
            smoothMoveWithRotationOnGroundCallFunc(viewer, imageLabel.id, NewRotation, Lon, Lat, Time, Ground)
        }))
        this.d(sceneObject.flyToEvent.don((duration, id) => {
            imageLabel.flyTo(duration);
        }));
        this.d(sceneObject.flyInEvent.don((duration) => {
            imageLabel.flyIn(duration);
        }))
        {
            const createDivToCanvas = () => {
                if (!viewer) return;
                if (!sceneObject.instanceClass) {
                    throw new Error(`!sceneObject.instanceClass`);
                }
                const div = document.createElement('div');

                //@ts-ignore
                const divContainer = this.dv(new sceneObject.instanceClass(div, sceneObject, ueViewer))._container;
                divContainer.style.opacity = sceneObject.opacity.toString() ?? ESGeoDiv.defaults.opacity;
                divContainer.style.position = 'fixed';
                divContainer.style.zIndex = '-1';
                divContainer.style.top = '0px';
                if (!document.body.contains(divContainer)) {
                    document.body.appendChild(divContainer);
                    let HasClassElements = divContainer ? divContainer.querySelectorAll('*[class]') : [];
                    for (let i = 0; i < HasClassElements.length; i++) {
                        const element = HasClassElements[i];
                        var rect = element.getBoundingClientRect();
                        // 存储所有class元素位置
                        this._hasClassDivAndPos[element.className] = [
                            element.offsetLeft,
                            element.offsetTop,
                            element.offsetLeft + rect.width,
                            element.offsetTop + rect.height,
                        ]
                    }
                }
                html2canvas(divContainer, {
                    backgroundColor: null,
                    allowTaint: true,
                    useCORS: true,
                    width: divContainer.offsetWidth,
                    height: divContainer.offsetHeight,
                    scale: 1,
                }).then((canvas) => {
                    if (document.body.contains(divContainer))
                        document.body.removeChild(divContainer);
                    imageLabel.url = canvas.toDataURL();
                }).catch(() => {
                    if (document.body.contains(divContainer))
                        document.body.removeChild(divContainer);
                });
            };
            const update = () => {
                try {
                    if (sceneObject.instanceClass) {
                        createDivToCanvas()
                    } else {
                        imageLabel.url = "";
                    }
                } catch (error) {
                    console.error(error)
                }
            };
            update();
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.instanceClassChanged,
                sceneObject.opacityChanged
            ));
            this.d(event.don(update));
        }
    }
}
