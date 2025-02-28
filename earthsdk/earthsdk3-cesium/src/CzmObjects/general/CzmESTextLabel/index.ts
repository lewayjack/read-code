import { ESJWidgetEventInfo, ESTextLabel } from "earthsdk3";
import html2canvas from "html2canvas";
import { CzmESLabel, CzmESObjectWithLocation, CzmImageModel, GeoDivTextPoi } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, defaultFlyToRotation, flyTo, flyWithPosition, getCzmPickedInfoFromPickedInfo, getObjectProperties } from "../../../utils";
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, react, track } from "xbsj-base";

export class TextLabel2D extends Destroyable {
    private _czmTextLabel;
    get czmTextLabel() { return this._czmTextLabel; }

    public flyTo = (duration: number | undefined, id: number) => {
        if (this.czmTextLabel.position) {
            flyTo(this.czmViewer.viewer, this.czmTextLabel.position, 1000, defaultFlyToRotation, duration);
            return;
        }
        this.czmTextLabel.flyTo(duration && duration * 1000);
    }

    constructor(sceneObject: ESTextLabel, private czmViewer: ESCesiumViewer) {
        super();
        this._czmTextLabel = this.disposeVar(new GeoDivTextPoi(czmViewer, sceneObject.id));
        const czmTextLabel = this._czmTextLabel;

        const updateAnchor = () => {
            const anchor = sceneObject.anchor;
            const offset = sceneObject.offset;
            if (anchor) {
                czmTextLabel.originRatioAndOffset = [...anchor, -offset[0], -offset[1]];
            } else {
                czmTextLabel.originRatioAndOffset = [0, 0, 0, 0];
            }
        }
        const event = this.ad(createNextAnimateFrameEvent(sceneObject.anchorChanged, sceneObject.offsetChanged));
        this.dispose(event.disposableOn(() => updateAnchor()));
        updateAnchor();

        this.dispose(track([czmTextLabel, 'zOrder'], [sceneObject, 'zOrder']));
        this.dispose(track([czmTextLabel, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmTextLabel, 'text'], [sceneObject, 'text']));
        this.dispose(track([czmTextLabel, 'color'], [sceneObject, 'color']));
        this.dispose(track([czmTextLabel, 'backgroundColor'], [sceneObject, 'backgroundColor']));
        this.dispose(bind([czmTextLabel, 'textEditingInteraction'], [sceneObject, 'textEditingInteraction']));
        this.dispose(bind([czmTextLabel, 'textEditing'], [sceneObject, 'textEditing']));
        this.dispose(bind([czmTextLabel, 'position'], [sceneObject, 'position']));
        this.dispose(track([czmTextLabel, 'width'], [sceneObject, 'width']));
        // this.dispose(track([czmTextLabel, 'originRatioAndOffset'], [sceneObject, 'originRatioAndOffset']));
        this.dispose(track([czmTextLabel, 'opacity'], [sceneObject, 'opacity']));
        this.dispose(track([czmTextLabel, 'padding'], [sceneObject, 'padding']));
        this.dispose(track([czmTextLabel, 'borderRadius'], [sceneObject, 'borderRadius']));
        this.dispose(track([czmTextLabel, 'borderColor'], [sceneObject, 'borderColor']));
        this.dispose(track([czmTextLabel, 'borderWidth'], [sceneObject, 'borderWidth']));
        this.dispose(track([czmTextLabel, 'textAlign'], [sceneObject, 'textAlign']));
        this.dispose(track([czmTextLabel, 'fontSize'], [sceneObject, 'fontSize']));
        this.dispose(track([czmTextLabel, 'borderStyle'], [sceneObject, 'borderStyle']));
        this.dispose(track([czmTextLabel, 'pickOnClick'], [sceneObject, 'allowPicking']));
        {
            const update = () => {
                czmTextLabel.scale = [sceneObject.scale[1], sceneObject.scale[2]];
            }
            update()
            this.dispose(sceneObject.scaleChanged.don(update))
        }
        {
            const update = () => {
                if (sceneObject.sizeByContent) {
                    czmTextLabel.width = undefined
                    czmTextLabel.height = undefined
                } else {
                    czmTextLabel.width = sceneObject.size[0]
                    czmTextLabel.height = sceneObject.size[1]
                }
            }
            update()
            this.dispose(sceneObject.sizeByContentChanged.don(update))
            this.dispose(sceneObject.sizeChanged.don(update))
        }
        {
            this.d(czmTextLabel.pickedEvent.don(pickedInfo => {
                const pointerEvent = getObjectProperties(pickedInfo, "attachedInfo")?.pointerEvent;
                if (!pointerEvent) return;
                // 响应widgetEvent事件
                // 鼠标点击事件
                const eventInfo = {
                    type: pointerEvent.buttons != 0 && pointerEvent.button == 0 ? "leftClick" : pointerEvent.button == 2 ? "rightClick" : undefined,
                    add: { mousePos: [pointerEvent.offsetX, pointerEvent.offsetY] as [number, number] }
                }
                if (eventInfo.type == undefined) {
                    eventInfo.type = pointerEvent.type;
                }
                sceneObject.widgetEvent.emit(eventInfo as ESJWidgetEventInfo)
                // 左键事件，额外进行响应pickedEvent事件
                if (pointerEvent.buttons != 0 && pointerEvent.button == 0 && (sceneObject.allowPicking ?? false)) {
                    const pickInfo = getCzmPickedInfoFromPickedInfo(pickedInfo)
                    sceneObject.pickedEvent.emit({ attachedInfo: pickInfo });
                }
            }))
        }
    }
}

export class TextLabel3D extends Destroyable {

    private _czmTextLabel;
    get czmTextLabel() { return this._czmTextLabel; }

    private _czmImageModel;
    get czmImageModel() { return this._czmImageModel; }

    private _url = this.disposeVar(react(""));
    get url() { return this._url.value; }

    private _defaultSize = this.disposeVar(react<[number, number]>([1, 1]))
    get defaultSize() { return this._defaultSize.value }
    get defaultSizeChanged() { return this._defaultSize.changed }

    private _size = this.disposeVar(react<[number, number]>([1, 1]))
    get size() { return this._size.value }
    get sizeChanged() { return this._size.changed }

    //鼠标模式
    private _eventInfo: ESJWidgetEventInfo = { type: "leftClick", add: { mousePos: [0, 0] } };
    private _isPointEvent: boolean = false;

    public flyTo = (duration: number | undefined, id: number) => {
        if (this.czmImageModel.position)
            return flyWithPosition(this._czmViewer, this.sceneObject, id, this.sceneObject.position, Math.max(...this.czmImageModel.size), duration, true);
        this.czmImageModel.flyTo(duration && duration * 1000);
    }

    constructor(private sceneObject: ESTextLabel, private _czmViewer: ESCesiumViewer) {
        super();
        this._czmTextLabel = this.disposeVar(new GeoDivTextPoi(_czmViewer, sceneObject.id));
        this._czmImageModel = this.disposeVar(new CzmImageModel(_czmViewer, sceneObject.id));
        const czmViewer = this._czmViewer;
        const czmTextLabel = this._czmTextLabel;
        czmTextLabel.originRatioAndOffset = [1000, 0, 0, 0]
        this.dispose(czmTextLabel.divCreatedEvent.disposableOn((div) => {

            const timer = setTimeout(() => {
                html2canvas(div, {
                    backgroundColor: null,
                    allowTaint: false,
                    useCORS: true,
                    width: div.offsetWidth,
                    height: div.offsetHeight,
                    scale: 1,
                }).then((canvas) => {

                    const img = new Image();
                    img.onload = () => {
                        if (sceneObject.sizeByContent) {
                            this._size.value = [img.width / 100, img.height / 100];

                        } else {
                            this._size.value = [sceneObject.size[0] / 100, sceneObject.size[1] / 100];

                        }
                    };
                    img.src = canvas.toDataURL("image/png");

                    this._url.value = canvas.toDataURL("image/png");

                }).catch((error) => {
                    console.error(error);
                })
            }, 50)
            this.dispose(() => clearTimeout(timer));

        }))

        this.dispose(bind([czmTextLabel, 'position'], [sceneObject, 'position']));
        this.dispose(bind([czmTextLabel, 'text'], [sceneObject, 'text']));
        this.dispose(track([czmTextLabel, 'color'], [sceneObject, 'color']));
        this.dispose(track([czmTextLabel, 'fontSize'], [sceneObject, 'fontSize']));
        const updateAnchor = () => {
            const anchor = sceneObject.anchor;
            const offset = sceneObject.offset;
            if (anchor) {
                this.czmImageModel.originRatioAndOffset = [...anchor, -offset[0] / 100, -offset[1] / 100];
            } else {
                this.czmImageModel.originRatioAndOffset = [0, 0, 0, 0];
            }
        }
        const event = this.ad(createNextAnimateFrameEvent(sceneObject.anchorChanged, sceneObject.offsetChanged));
        this.dispose(event.disposableOn(() => updateAnchor()));
        updateAnchor();
        {
            const update = () => {

                this._czmTextLabel.show = false

                const czmImageModel = this._czmImageModel;

                czmImageModel.uri = this._url.value
                czmImageModel.pixelSize = undefined
                czmImageModel.useAxis = "XZ";
                this.dispose(this.sizeChanged.disposableOn(() => {
                    czmImageModel.size = this._size.value;
                }))

                this.dispose(bind([czmImageModel, 'positionEditing'], [sceneObject, 'editing']));
                this.dispose(track([czmImageModel, 'show'], [sceneObject, 'show']));
                this.dispose(bind([czmImageModel, 'position'], [sceneObject, 'position']));
                this.dispose(track([czmImageModel, 'allowPicking'], [sceneObject, 'allowPicking']));
                {
                    const update = () => {
                        czmImageModel.scale = [sceneObject.scale[1], sceneObject.scale[2]];
                    }
                    update();
                    this.d(sceneObject.scaleChanged.don(update))
                }
                {
                    const update = () => {
                        if (sceneObject.rotationType === 0) {
                            czmImageModel.rotationMode = "WithProp"
                            this.d(bindNorthRotation([czmImageModel, 'rotation'], [sceneObject, 'rotation']));
                        }
                        if (sceneObject.rotationType === 1) {
                            czmImageModel.rotationMode = "WithCamera"
                        }
                        if (sceneObject.rotationType === 2) {
                            czmImageModel.rotationMode = 'WithCameraOnlyZ'
                        }
                    }
                    update()
                    this.dispose(sceneObject.rotationTypeChanged.disposableOn(update))
                }

            }
            this.dispose(this._url.changed.disposableOn(update))
        }
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
    }
}

export class CzmESTextLabel extends CzmESLabel<ESTextLabel> {
    static readonly type = this.register("ESCesiumViewer", ESTextLabel.type, this);

    private _event = this.disposeVar(createNextAnimateFrameEvent(this.sceneObject.screenRenderChanged, this.sceneObject.sizeByContentChanged, this.sceneObject.sizeChanged));
    get event() { return this._event; }

    private _resetting = this.disposeVar(new ObjResettingWithEvent(this._event, () => {
        if (this.sceneObject.screenRender) {
            return new TextLabel2D(this.sceneObject, this.czmViewer);
        } else {
            return new TextLabel3D(this.sceneObject, this.czmViewer);
        }
    }))
    get resetting() { return this._resetting; }


    constructor(sceneObject: ESTextLabel, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }


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
