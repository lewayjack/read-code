import { ESImageLabel, ESJWidgetEventInfo, ESSceneObject } from "earthsdk3";
import { CzmESLabel, GeoCanvasImagePoi } from "../../../CzmObjects";
import { CzmImageModel } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, defaultFlyToRotation, flyTo, flyWithPosition, getCzmPickedInfoFromPickedInfo, getObjectProperties, rpToap } from "../../../utils";
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, track } from "xbsj-base";

export class ImageLabel2D extends Destroyable {
    private _czmGeoCanvasImagePoi;
    get czmGeoCanvasImagePoi() { return this._czmGeoCanvasImagePoi; }

    public flyTo = (duration: number | undefined, id: number) => {
        if (this.czmGeoCanvasImagePoi.position) {
            flyTo(this.czmViewer.viewer, this.czmGeoCanvasImagePoi.position, 1000, defaultFlyToRotation, duration);
            return;
        }
        this.czmGeoCanvasImagePoi.flyTo(duration && duration * 1000);
    }

    constructor(private sceneObject: ESImageLabel, private czmViewer: ESCesiumViewer) {
        super();
        this._czmGeoCanvasImagePoi = this.disposeVar(new GeoCanvasImagePoi(czmViewer));
        const czmGeoCanvasImagePoi = this._czmGeoCanvasImagePoi;

        czmGeoCanvasImagePoi.pickOnClick = true;
        this.d(czmGeoCanvasImagePoi.pickedEvent.don(pickedInfo => {
            if (sceneObject.allowPicking ?? false) {
                const pickInfo = getCzmPickedInfoFromPickedInfo(pickedInfo)
                sceneObject.pickedEvent.emit({ attachedInfo: pickInfo });
            }
        }));

        {
            const getStrFromEnvUrl = (url: string) => {
                let strUrl = url;
                const flag = url.includes('inner://');
                if (flag) {
                    const imgName = url.split('inner://')[1];
                    strUrl = '${earthsdk3-assets-script-dir}/assets/img/points/' + imgName;
                }
                return ESSceneObject.context.getStrFromEnv(rpToap(strUrl));
            }

            const update = () => {
                const url = getStrFromEnvUrl(typeof sceneObject.url == 'string' ? sceneObject.url : sceneObject.url.url);
                czmGeoCanvasImagePoi.imageUri = url
                const sizeByContent = sceneObject.sizeByContent;
                if (sizeByContent) {
                    const image = new Image()
                    image.src = url;
                    image.onload = () => {
                        czmGeoCanvasImagePoi.size = [image.width, image.height];
                    }
                } else {
                    const size = sceneObject.size;
                    czmGeoCanvasImagePoi.size = [...size];
                }
            }
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.urlChanged,
                sceneObject.sizeByContentChanged,
                sceneObject.sizeChanged,
            ));
            this.dispose(updateEvent.disposableOn(() => update()));
            update()

            this.d(track([czmGeoCanvasImagePoi, 'zOrder'], [sceneObject, 'zOrder']));
            this.dispose(track([czmGeoCanvasImagePoi, 'show'], [sceneObject, 'show']));
            this.dispose(bind([czmGeoCanvasImagePoi, 'position'], [sceneObject, 'position']));

            {
                const update = () => {
                    czmGeoCanvasImagePoi.scale = [sceneObject.scale[1], sceneObject.scale[2]];
                }
                update();
                this.dispose(sceneObject.scaleChanged.don(update));
            }
            const updateAnchor = () => {
                const anchor = sceneObject.anchor;
                const offset = sceneObject.offset;
                if (anchor) {
                    czmGeoCanvasImagePoi.originRatioAndOffset = [...anchor, -offset[0], -offset[1]];
                } else {
                    czmGeoCanvasImagePoi.originRatioAndOffset = [0, 0, 0, 0];
                }
            }
            const event = this.ad(createNextAnimateFrameEvent(sceneObject.anchorChanged, sceneObject.offsetChanged));
            this.dispose(event.disposableOn(() => updateAnchor()));
            updateAnchor();

            this.dispose(czmGeoCanvasImagePoi.clickEvent.disposableOn(e => {
                const { offsetX, offsetY } = e;
                const type = e.button === 0 ? "leftClick" : e.button === 2 ? "rightClick" : undefined;
                const eventInfo = {
                    type,
                    add: { mousePos: [offsetX, offsetY] }
                };
                sceneObject.widgetEvent.emit(eventInfo as ESJWidgetEventInfo);
            }));

            this.dispose(czmGeoCanvasImagePoi.hoveredChanged.disposableOn(bol => {
                if (bol === undefined) return;
                const eventInfo = {
                    type: bol ? "mouseEnter" : "mouseLeave" as ESJWidgetEventInfo['type'],
                }
                sceneObject.widgetEvent.emit(eventInfo);
            }));
        }
    }
}

export class ImageLabel3D extends Destroyable {
    private _czmGeoImageModel;
    get czmGeoImageModel() { return this._czmGeoImageModel; }

    //鼠标模式
    private _eventInfo: ESJWidgetEventInfo = { type: "leftClick", add: { mousePos: [0, 0] } };
    private _isPointEvent: boolean = false;

    public flyTo = (duration: number | undefined, id: number) => {
        if (this.czmGeoImageModel.position)
            return flyWithPosition(this.czmViewer, this.sceneObject, id, this.sceneObject.position, Math.max(...this.czmGeoImageModel.size), duration, true);
        this.czmGeoImageModel.flyTo(duration && duration * 1000);
    }

    constructor(private sceneObject: ESImageLabel, private czmViewer: ESCesiumViewer, czmESImageLabel: CzmESImageLabel) {
        super();
        this._czmGeoImageModel = this.disposeVar(new CzmImageModel(czmViewer, sceneObject.id));
        const czmGeoImageModel = this._czmGeoImageModel;

        {
            this.ad(czmViewer.clickEvent.don(pickedInfo => {
                const pointerEvent = pickedInfo?.pointerEvent;
                if (!pointerEvent) return;
                this._isPointEvent = true;
                this._eventInfo = {
                    type: pointerEvent.button == 0 ? "leftClick" : pointerEvent.button == 2 ? "rightClick" : "leftClick",
                    add: { mousePos: [pointerEvent.offsetX, pointerEvent.offsetY] as [number, number] }
                }
            }))
            this.d(sceneObject.pickedEvent.don(pickedInfo => {
                // 响应widgetEvent事件
                // 鼠标点击事件
                if (this._isPointEvent && pickedInfo.attachedInfo != "innerHoverEvent" && this._eventInfo.add?.mousePos &&
                    Math.abs(pickedInfo.pickedInfo.screenPosition[0] - this._eventInfo.add?.mousePos[0]) < 1 &&
                    Math.abs(pickedInfo.pickedInfo.screenPosition[1] - this._eventInfo.add?.mousePos[1]) < 1) {
                    sceneObject.widgetEvent.emit(this._eventInfo as ESJWidgetEventInfo)
                    this._isPointEvent = false;
                }
            }))
            const czmSceneObject = czmViewer.getCzmObject(sceneObject) as CzmESLabel;
            this.ad(czmSceneObject.lastHoverResultChanged.don((newVal, oldVal) => {
                if (newVal?.sceneObject == oldVal?.sceneObject || (newVal?.sceneObject != sceneObject && oldVal?.sceneObject != sceneObject)) return;
                do {
                    if (newVal?.sceneObject == undefined) {
                        this._eventInfo = {
                            type: "mouseLeave",
                            add: { mousePos: newVal?.screenPosition as [number, number] }
                        }
                    }
                    if (oldVal?.sceneObject == undefined) {
                        this._eventInfo = {
                            type: "mouseEnter",
                            add: { mousePos: newVal?.screenPosition as [number, number] }
                        }
                    }
                } while (false);
                sceneObject.widgetEvent.emit(this._eventInfo as ESJWidgetEventInfo)
            }))
        }

        const sizeByContent = sceneObject.sizeByContent;

        const getStrFromEnvUrl = (url: string) => {
            let strUrl = url;
            const flag = url.includes('inner://');
            if (flag) {
                const imgName = url.split('inner://')[1];
                strUrl = '${earthsdk3-assets-script-dir}/assets/img/points/' + imgName;
            }
            // return SceneObject.context.getStrFromEnv(strUrl);
            return ESSceneObject.context.getStrFromEnv(rpToap(strUrl));
        }

        // const url = getStrFromEnvUrl(czmESImageLabel.urlReact ?? ESImageLabel.defaults.url);
        const url = getStrFromEnvUrl(typeof czmESImageLabel.sceneObject.url == 'string' ? czmESImageLabel.sceneObject.url : czmESImageLabel.sceneObject.url.url);

        const image = new Image()
        image.src = url;
        image.onload = () => {
            if (sizeByContent) {
                czmGeoImageModel.size = [image.width / 100, image.height / 100];
            } else {
                const size = sceneObject.size;
                czmGeoImageModel.size = [size[0] / 100, size[1] / 100];
            }
        }
        czmGeoImageModel.uri = url

        this.dispose(bind([czmGeoImageModel, 'positionEditing'], [sceneObject, 'editing']));
        this.dispose(track([czmGeoImageModel, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmGeoImageModel, 'position'], [sceneObject, 'position']));
        this.dispose(track([czmGeoImageModel, 'allowPicking'], [sceneObject, 'allowPicking']));
        czmGeoImageModel.pixelSize = undefined
        czmGeoImageModel.useAxis = "XZ";
        {
            const update = () => {
                czmGeoImageModel.scale = [sceneObject.scale[1], sceneObject.scale[2]];
            }
            update();
            this.d(sceneObject.scaleChanged.don(update))
        }
        {
            const update = () => {
                if (sceneObject.rotationType === 0) {
                    czmGeoImageModel.rotationMode = "WithProp"
                    this.d(bindNorthRotation([czmGeoImageModel, 'rotation'], [sceneObject, 'rotation']));
                }
                if (sceneObject.rotationType === 1) {
                    czmGeoImageModel.rotationMode = "WithCamera"
                }
                if (sceneObject.rotationType === 2) {
                    czmGeoImageModel.rotationMode = 'WithCameraOnlyZ'
                }
            }
            update()
            this.dispose(sceneObject.rotationTypeChanged.disposableOn(update))
        }
        const updateAnchor = () => {
            const anchor = sceneObject.anchor;
            const offset = sceneObject.offset;
            if (anchor) {
                czmGeoImageModel.originRatioAndOffset = [...anchor, -offset[0] / 100, -offset[1] / 100];
            } else {
                czmGeoImageModel.originRatioAndOffset = [0, 0, 0, 0];
            }
        }
        const event = this.ad(createNextAnimateFrameEvent(sceneObject.anchorChanged, sceneObject.offsetChanged));
        this.dispose(event.disposableOn(() => updateAnchor()));
        updateAnchor();
    }
}

export class CzmESImageLabel extends CzmESLabel<ESImageLabel> {
    static readonly type = this.register("ESCesiumViewer", ESImageLabel.type, this);

    private _resetting;
    get resetting() { return this._resetting; }

    constructor(sceneObject: ESImageLabel, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const event = this.disposeVar(createNextAnimateFrameEvent(this.sceneObject.urlChanged, this.sceneObject.screenRenderChanged, this.sceneObject.sizeByContentChanged, this.sceneObject.sizeChanged));
        this._resetting = this.disposeVar(new ObjResettingWithEvent(event, () => {
            if (this.sceneObject.screenRender) {
                return new ImageLabel2D(this.sceneObject, this.czmViewer);
            }
            else {
                return new ImageLabel3D(this.sceneObject, this.czmViewer, this);
            }
        }))
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, resetting } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (resetting && resetting.obj) {
                resetting.obj.flyTo(duration, id);
            }
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
