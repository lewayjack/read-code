import { AttachedPickedInfo, DivPickedInfo, PickedInfo } from "earthsdk3";
import { CzmDivPoi } from "../../../../../CzmObjects";
import { ESCesiumViewer, getViewerExtensions } from "./../../../../../ESCesiumViewer";
import { CzmViewDistanceRangeControl, flyTo, positionToCartesian } from "../../../../../utils";
import { Destroyable, Listener, react, Event, reactArrayWithUndefined, reactArray, extendClassProps, ReactivePropsToNativePropsAndChanged, PosFloatDiv, ObjResettingWithEvent, track, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";

export type GeoCustomDivPoiInstanceClass<DivClass extends { destroy(): undefined } = { destroy(): undefined }> = (new (container: HTMLDivElement, customDiv: GeoCustomDivPoi<DivClass>, viewer: ESCesiumViewer) => DivClass);

const defaulInstanceClassStr = `class MyDiv {
    // container是Poi的div
    // geoCustomDivPoi指向当前的GeoCustomDivPoi场景对象
    // viewer指定当前的视口
    constructor(container, geoCustomDivPoi, viewer) {       
        this._container = container;
        this._div = document.createElement('div');
        this._container.appendChild(this._div);

        this._div.style.width = '300px';
        this._div.style.height = '50px';
        this._div.style.background = 'rgba(120, 120, 0, 0.7)';
        this._div.style.color = 'white';
        this._div.style.fontSize = '30px';
        this._div.style.lineHeight = '50px';
        this._div.style.border = '1px solid white';
        this._div.innerText = 'Hello world!';
    }

    // 随机背景颜色，仅用于测试外部强制更新，此函数非必需
    update() {
        const r = (255 * Math.random()) | 0;
        const g = (255 * Math.random()) | 0;
        const b = (255 * Math.random()) | 0;
        this._div.style.background = \`rgba(\${r}, \${g}, \${b}, 0.8)\`;
    }

    // 销毁函数，注意此函数必需，否则会报错！
    destroy() {
        this._container.removeChild(this._div);
    }
}`;

const instanceClassStrReadMe = `\
示例代码：  
\`\`\`
${defaulInstanceClassStr}
\`\`\`
`;

const defaultInnerHTML = `\
<div style="width: 300px; height: 50px; background: rgba(120, 120, 0, 0.7); color: white; font-size: 30px; line-height: 50px; border: 1px solid white;">Hello world!</div>
`;

const innerHTMLReadMe = `\
示例代码：  
\`\`\`
${defaultInnerHTML}
\`\`\`
`;

export class GeoCustomDivPoi<DivClass extends { destroy(): undefined } = { destroy(): undefined }> extends Destroyable {
    private _updateEvent = this.disposeVar(new Event<[(divClass: DivClass, dom: GeoCustomDivPoi<DivClass>, viewer: ESCesiumViewer) => void]>());
    update(updateFunc: (divClass: DivClass, customDiv: GeoCustomDivPoi<DivClass>, viewer: ESCesiumViewer) => void) {
        this._updateEvent.emit(updateFunc);
    }

    private _instanceClassReact = this.disposeVar(react<GeoCustomDivPoiInstanceClass<DivClass> | undefined>(undefined));
    get instanceClass() { return this._instanceClassReact.value; }
    set instanceClass(value: GeoCustomDivPoiInstanceClass<DivClass> | undefined) { this._instanceClassReact.value = value; }
    get instanceClassChanged() { return this._instanceClassReact.changed; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    pickFromDiv(element: HTMLElement, childPickedInfo?: PickedInfo) {
        if (this.allowPicking ?? false) {
            this.pickedEvent.emit(new DivPickedInfo(element, childPickedInfo));
        }
    }

    private _innerHtmlMounted = this.disposeVar(new Event<[contentDiv: HTMLDivElement, viewer: ESCesiumViewer]>());
    get innerHtmlMounted() { return this._innerHtmlMounted as Listener<[contentDiv: HTMLDivElement, viewer: ESCesiumViewer]>; }

    static defaulInstanceClassStr = defaulInstanceClassStr;
    static instanceClassStrReadMe = instanceClassStrReadMe;

    private _czmDivPoi?: CzmDivPoi<PosFloatDiv>;
    get czmDivPoi() { return this._czmDivPoi; }
    set czmDivPoi(v: CzmDivPoi<PosFloatDiv> | undefined) { this._czmDivPoi = v; }

    private _objResetting: ObjResettingWithEvent<DivClass, Listener<any[]>> | undefined;
    get objResetting() { return this._objResetting; }

    private _czmViewVisibleDistanceRangeControl;
    get czmViewerVisibleDistanceRangeControl() { return this._czmViewVisibleDistanceRangeControl; }
    get visibleAlpha() { return this._czmViewVisibleDistanceRangeControl.visibleAlpha; }
    get visibleAlphaChanged() { return this._czmViewVisibleDistanceRangeControl.visibleAlphaChanged; }

    static defaults = {
        position: [116.39, 39.9, 0] as [number, number, number],
        instanceClassStr: defaulInstanceClassStr,
        instanceClassStrReadMe: instanceClassStrReadMe,
        innerHTML: defaultInnerHTML,
        innerHTMLReadMe: innerHTMLReadMe,
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
        zOrder: 0,
    };

    // private _sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'editing'], this.components));
    // get sPositionEditing() { return this._sPositionEditing; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._czmViewVisibleDistanceRangeControl = this.disposeVar(new CzmViewDistanceRangeControl(
            czmViewer,
            [this, 'viewDistanceRange'],
            [this, 'position'],
            // [this.sceneObject, 'radius'],
        ));
        this.dispose(track([this._czmViewVisibleDistanceRangeControl, 'debug'], [this, 'viewDistanceDebug']))
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const viewerExtensions = getViewerExtensions(viewer);
        if (!viewerExtensions) return;
        const { poiContext, labelManager } = viewerExtensions;
        //@ts-ignore
        labelManager.add(this);
        this.ad(() => {
            //@ts-ignore
            labelManager.delete(this);
        })
        const czmDivPoi = this._czmDivPoi = this.disposeVar(new CzmDivPoi(PosFloatDiv, poiContext));
        {
            const update = () => {
                const { contentDiv } = czmDivPoi.divPoi.floatDiv;
                contentDiv.style.all = this.cssAllInitial ? 'initial' : 'unset';
            }
            update();
            this.dispose(this.cssAllInitialChanged.disposableOn(update));
        }

        const instanceClassCreatingEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.instanceClassChanged,
            this.shadowDomChanged,
        ));
        const objResetting = this.disposeVar(new ObjResettingWithEvent<DivClass>(instanceClassCreatingEvent, () => {
            const { instanceClass } = this;
            if (!instanceClass) return undefined;

            let { contentDiv } = czmDivPoi.divPoi.floatDiv;
            contentDiv.firstElementChild && contentDiv.removeChild(contentDiv.firstElementChild);
            if (this.shadowDom) {
                const div = contentDiv.appendChild(document.createElement("div"));
                const shadowRoot = div.attachShadow({ mode: "open" });
                contentDiv = shadowRoot.appendChild(document.createElement("div"));
            }

            return new instanceClass(contentDiv, this, czmViewer);
        }));
        this._objResetting = objResetting;

        // @ts-ignore
        const { _updateEvent } = this;
        this.dispose(_updateEvent.disposableOn((func: (divClass: DivClass, sceneObject: GeoCustomDivPoi<DivClass>, viewer: ESCesiumViewer) => void) => {
            if (objResetting.obj) {
                try {
                    func(objResetting.obj, this, czmViewer);
                } catch (error) {
                    console.error(`CustomDiv update error! ${error}`);
                }
            }
        }));

        const updateOpacity = () => {
            czmDivPoi.divPoi.floatDiv.opacity = (this.opacity ?? 1.0) * this.visibleAlpha;
        };
        updateOpacity();
        this.dispose(this.opacityChanged.disposableOn(updateOpacity));
        this.dispose(this.visibleAlphaChanged.disposableOn(updateOpacity));

        const updateOrigin = () => {
            const [rx, ry, ox, oy] = this.originRatioAndOffset ?? [0.5, 1.0, 0, 0];
            czmDivPoi.divPoi.floatDiv.originRatioX = rx;
            czmDivPoi.divPoi.floatDiv.originRatioY = ry;
            czmDivPoi.divPoi.floatDiv.originOffsetX = ox;
            czmDivPoi.divPoi.floatDiv.originOffsetY = oy;
        };
        updateOrigin();
        this.dispose(this.originRatioAndOffsetChanged.disposableOn(updateOrigin));

        const updatePrimitive = () => {
            this.position && (czmDivPoi.cartesian = positionToCartesian(this.position));
            czmDivPoi.show = (this.show ?? true) && !!this.position && (this.visibleAlpha > 0);
        }
        updatePrimitive();
        // this.dispose(updateEvent.disposableOn(updatePrimitive));
        this.dispose(this.positionChanged.disposableOn(updatePrimitive));
        this.dispose(this.showChanged.disposableOn(updatePrimitive));
        this.dispose(this.visibleAlphaChanged.disposableOn(updatePrimitive));

        {
            //pickedEvent
            const { contentDiv } = czmDivPoi.divPoi.floatDiv;
            contentDiv.addEventListener('mouseenter', (e) => {
                if (this.allowPicking ?? false) {
                    this.pickFromDiv(contentDiv, { "attachedInfo": { "pointerEvent": e } } as AttachedPickedInfo);
                }
            })
            contentDiv.addEventListener('mouseleave', (e) => {
                if (this.allowPicking ?? false) {
                    this.pickFromDiv(contentDiv, { "attachedInfo": { "pointerEvent": e } } as AttachedPickedInfo);
                }
            })
            contentDiv.addEventListener('mousedown', (e) => {
                if (this.allowPicking ?? false) {
                    this.pickFromDiv(contentDiv, { "attachedInfo": { "pointerEvent": e } } as AttachedPickedInfo);
                }
            })
            contentDiv.oncontextmenu = (e) => {
                e.preventDefault();
            }
        }

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!this.position) {
                console.warn(`GeoPoint当前没有位置信息，无法飞入！`);
                return;
            }
            // 默认给1000米
            let viewDistance = 1000;
            // let viewDistance = viewer.scene.camera.positionCartographic.height;
            if (this.viewDistanceRange) {
                const [n0, n1, f1, f0] = this.viewDistanceRange;
                if (n0 > n1 || n1 > f1 || f1 > f0) {
                    console.error(`viewDistanceRange存在问题，需要满足逐级增大的条件，否则不生效！`);
                } else {
                    viewDistance = (n1 + f1) * .5;
                }
            }
            flyTo(viewer, this.position, viewDistance, undefined, duration);
        }));
        const updateInstanceClassStr = () => {
            try {
                this.instanceClass = this.instanceClassStr && Function(`"use strict";return (${this.instanceClassStr})`)();
            } catch (error) {
                this.instanceClass = undefined;
            }
        };
        updateInstanceClassStr();
        this.dispose(this.instanceClassStrChanged.disposableOn(updateInstanceClassStr));

        {
            const update = () => {
                if (this.innerHTML === undefined) {
                    this.instanceClassStr = undefined;
                    return;
                }

                const instanceClassStr = `class MyDiv {
                    // container是Poi的div
                    // geoCustomDivPoi指向当前的GeoCustomDivPoi场景对象
                    // viewer指定当前的视口
                    constructor(container, geoCustomDivPoi, viewer) {
                        this._container = container;
                        this._div = document.createElement('div');
                        this._container.appendChild(this._div);

                        this._div.innerHTML = \`${this.innerHTML}\`;
                        geoCustomDivPoi._innerHtmlMounted.emit(this._div, viewer);
                    }
                
                    // 销毁函数，注意此函数必需，否则会报错！
                    destroy() {
                        this._container.removeChild(this._div);
                    }
                }`;
                this.instanceClassStr = instanceClassStr;
            };
            update();
            this.dispose(this.innerHTMLChanged.disposableOn(update));
        }
    }
}

export namespace GeoCustomDivPoi {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        opacity: 1,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 必须是3的倍数！A Property specifying the array of Cartesian3 positions that define the line strip.
        editing: false,
        originRatioAndOffset: reactArray<[leftRatio: number, topRatio: number, leftOffset: number, topOffset: number]>([0.5, 1, 0, 0]), // 为undefined时设置为[0.5, 1.0, 0, 0]
        instanceClassStr: undefined as string | undefined,
        innerHTML: undefined as string | undefined,
        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,
        shadowDom: false,
        cssAllInitial: false,
        zOrder: 0,
    });
}
extendClassProps(GeoCustomDivPoi.prototype, GeoCustomDivPoi.createDefaultProps);
export interface GeoCustomDivPoi extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoCustomDivPoi.createDefaultProps>> { }
