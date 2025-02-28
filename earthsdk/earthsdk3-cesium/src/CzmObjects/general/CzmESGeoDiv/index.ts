import { ESGeoDiv, ESJWidgetEventInfo, SceneObjectPickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { defaultFlyToRotation, flyTo, getCzmPickedInfoFromPickedInfo, getObjectProperties } from "../../../utils";
import { bind, Destroyable, track } from "xbsj-base";
import { CzmESObjectWithLocation, GeoCustomDivPoi } from "../../../CzmObjects";

/**
 * https://www.wolai.com/earthsdk/e17QPxZkVnG3ujXj8sJ2un
 */
export class CzmESGeoDiv extends CzmESObjectWithLocation<ESGeoDiv> {
    static readonly type = this.register("ESCesiumViewer", ESGeoDiv.type, this);

    private _czmGeoCustomDivPoi;
    get czmGeoCustomDivPoi() { return this._czmGeoCustomDivPoi; }

    private _divContainer: any;
    private _hasClassDivAndPos = {} as { [key: string]: [number, number, number, number] };

    constructor(sceneObject: ESGeoDiv, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmGeoCustomDivPoi = this.disposeVar(new GeoCustomDivPoi(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmGeoCustomDivPoi = this._czmGeoCustomDivPoi;
        czmGeoCustomDivPoi.cssAllInitial = true;
        this.dispose(track([czmGeoCustomDivPoi, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmGeoCustomDivPoi, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmGeoCustomDivPoi, 'position'], [sceneObject, 'position']));
        this.dispose(track([czmGeoCustomDivPoi, 'opacity'], [sceneObject, 'opacity']));
        this.d(track([czmGeoCustomDivPoi, 'zOrder'], [sceneObject, "zOrder"]));
        {
            const update = () => {
                czmGeoCustomDivPoi.originRatioAndOffset = [...sceneObject.anchor, 0, 0];
                if (this._divContainer && this._divContainer.children[0]) {
                    //@ts-ignore
                    this._divContainer.children[0].style.transformOrigin = `${sceneObject.anchor[0] * 100}% ${sceneObject.anchor[1] * 100}%`;
                }
            }
            update();
            this.dispose(sceneObject.anchorChanged.don(update))
        }
        {
            const createInstanceClass = () => {
                const _this = this;
                return class MyDiv extends Destroyable {
                    constructor(private _subContainer: HTMLDivElement, czmGeoCustomDivPoi: GeoCustomDivPoi<{ destroy(): undefined; }>, viewer?: ESCesiumViewer | undefined) {
                        super()
                        if (!viewer) return;
                        if (!(viewer instanceof ESCesiumViewer)) return;
                        if (!sceneObject.instanceClass) {
                            throw new Error(`!sceneObject.instanceClass`);
                        }
                        //@ts-ignore
                        _this._divContainer = this.disposeVar(new sceneObject.instanceClass(_subContainer, sceneObject, viewer))._container;
                        this.d(sceneObject.scaleChanged.don(() => {
                            if (_this._divContainer.children[0]) {
                                //@ts-ignore
                                _this._divContainer.children[0].style.transform = `scale(${sceneObject.scale[1]},${sceneObject.scale[2]})`;
                                //@ts-ignore
                                _this._divContainer.children[0].style.transformOrigin = `${sceneObject.anchor[0] * 100}% ${sceneObject.anchor[1] * 100}%`;
                            }
                        }));
                        let HasClassElements = _this._divContainer ? _this._divContainer.querySelectorAll('*[class]') : [];
                        for (let i = 0; i < HasClassElements.length; i++) {
                            const element = HasClassElements[i];
                            var rect = element.getBoundingClientRect();
                            // 存储所有class元素位置
                            _this._hasClassDivAndPos[element.className] = [
                                element.offsetLeft,
                                element.offsetTop,
                                element.offsetLeft + rect.width,
                                element.offsetTop + rect.height,
                            ]
                        }
                    }
                }
            };
            const update = () => {
                try {
                    if (sceneObject.instanceClass) {
                        czmGeoCustomDivPoi.instanceClass = createInstanceClass();
                    } else {
                        czmGeoCustomDivPoi.instanceClass = undefined;
                    }
                } catch (error) {
                    console.error(error);
                }
            };
            update();
            this.dispose(sceneObject.instanceClassChanged.disposableOn(update));
        }

        this.dispose(czmGeoCustomDivPoi.pickedEvent.disposableOn(pickedInfo => {
            const pointerEvent = getObjectProperties(pickedInfo, "attachedInfo")?.pointerEvent;
            if (!pointerEvent) return;
            // 响应widgetEvent事件
            // 鼠标点击事件
            const eventInfo = {
                type: pointerEvent.buttons != 0 && pointerEvent.button == 0 ? "leftClick" : pointerEvent.button == 2 ? "rightClick" : undefined,
                add: { mousePos: [pointerEvent.offsetX, pointerEvent.offsetY] as [number, number] }
            } as { [key: string]: any }
            if (eventInfo.type == undefined) {
                eventInfo.type = pointerEvent.type;
            }
            if (eventInfo.type === "leftClick") {
                const classNames = Object.keys(this._hasClassDivAndPos);
                for (let i = 0; i < classNames.length; i++) {
                    const className = classNames[i];
                    let rect = this._hasClassDivAndPos[className];
                    let elementRect = this._divContainer.getBoundingClientRect();
                    const offsetX = pointerEvent.clientX - elementRect.left;
                    const offsetY = pointerEvent.clientY - elementRect.top;
                    // 检查点击点是否与DIV元素重叠
                    if (offsetX >= rect[0] && offsetX <= rect[2] && offsetY >= rect[1] && offsetY <= rect[3]) {
                        // 点击点与DIV元素重叠，借用widgetEvent事件进行相应
                        eventInfo.add["className"] = className;
                        break;
                    }
                }
            }
            sceneObject.widgetEvent.emit(eventInfo as ESJWidgetEventInfo)
            // 左键事件，额外进行响应pickedEvent事件
            if (eventInfo.type === "leftClick" && (sceneObject.allowPicking ?? false)) {
                const pickInfo = getCzmPickedInfoFromPickedInfo(pickedInfo)
                sceneObject.pickedEvent.emit({ attachedInfo: pickInfo });
            }
        }));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmGeoCustomDivPoi } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmGeoCustomDivPoi.position)
                flyTo(czmViewer.viewer, czmGeoCustomDivPoi.position, 1000, defaultFlyToRotation, duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
