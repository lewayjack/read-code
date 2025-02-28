import { PickedInfo } from "earthsdk3";
import { PositionEditing } from "../../../../../CzmObjects";
import { ESCesiumViewer, getViewerExtensions } from "../../../../../ESCesiumViewer";
import { CzmViewDistanceRangeControl, flyTo, positionToCartesian } from "../../../../../utils";
import { CanvasPoi, CanvasPrimitivesContext, createGuid, createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, ObjResettingWithEvent, react, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, SceneObjectKey, track } from "xbsj-base";
import { CzmCanvasPoi, CzmPoisContext } from "../CzmPoisImpl";
import * as Cesium from 'cesium';

export type CanvasPoiClassAndCreateFuncPairType = [canvasPoiClass: new (canvasPrimitivesContext: CanvasPrimitivesContext) => CanvasPoi, createFunc: (canvasPoi: CanvasPoi, visibleAlphaChanged?: Listener<[number, number]>) => Destroyable];

/**
 * 该类是GeoCanvasPointPoi、GeoCanvasImagePoi等场景对象的基础类，不要直接使用！
 */
export class GeoCanvasPoi extends Destroyable {
    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    private _clickEvent = this.disposeVar(new Event<[PointerEvent]>());
    get clickEvent() { return this._clickEvent; }

    private _clickOutEvent = this.disposeVar(new Event<[PointerEvent]>());
    get clickOutEvent() { return this._clickOutEvent; }

    private _dblclickEvent = this.disposeVar(new Event<[PointerEvent]>());
    get dblclickEvent() { return this._dblclickEvent; }

    private _dblclickOutEvent = this.disposeVar(new Event<[PointerEvent]>());
    get dblclickOutEvent() { return this._dblclickOutEvent; }

    private _canvasPoiClassAndCreateFunc = react<CanvasPoiClassAndCreateFuncPairType | undefined>(undefined);
    get canvasPoiClassAndCreateFunc() { return this._canvasPoiClassAndCreateFunc.value; }
    set canvasPoiClassAndCreateFunc(value: CanvasPoiClassAndCreateFuncPairType | undefined) { this._canvasPoiClassAndCreateFunc.value = value; }
    get canvasPoiClassAndCreateFuncChanged() { return this._canvasPoiClassAndCreateFunc.changed; }

    private _czmViewVisibleDistanceRangeControl;
    get czmViewerVisibleDistanceRangeControl() { return this._czmViewVisibleDistanceRangeControl; }
    get visibleAlpha() { return this._czmViewVisibleDistanceRangeControl.visibleAlpha; }
    get visibleAlphaChanged() { return this._czmViewVisibleDistanceRangeControl.visibleAlphaChanged; }

    private _canvasObj?: ObjResettingWithEvent<CanvasPoiCreating, Listener<[CanvasPoiClassAndCreateFuncPairType | undefined, CanvasPoiClassAndCreateFuncPairType | undefined]>>;
    get canvasObj() { return this._canvasObj?.obj; }

    static defaults = {
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
    };

    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }
    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        this._czmViewVisibleDistanceRangeControl = this.disposeVar(new CzmViewDistanceRangeControl(
            czmViewer,
            [this, 'viewDistanceRange'],
            [this, 'position'],
            // [this.sceneObject, 'radius'],
        ));
        this.dispose(track([this._czmViewVisibleDistanceRangeControl, 'debug'], [this, 'viewDistanceDebug']));
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        this._sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'positionEditing'], czmViewer));
        const viewerExtensions = getViewerExtensions(viewer);
        if (!viewerExtensions) {
            return;
        }

        const { poiContext, labelManager } = viewerExtensions;
        labelManager.add(this);
        this.d(() => { labelManager.delete(this) });
        if (!poiContext) {
            return;
        }

        this._canvasObj = this.disposeVar(new ObjResettingWithEvent(this.canvasPoiClassAndCreateFuncChanged, () => {
            if (!this.canvasPoiClassAndCreateFunc) {
                return undefined;
            }
            const [canvasPoiClass, createFunc] = this.canvasPoiClassAndCreateFunc
            return new CanvasPoiCreating(this, canvasPoiClass, poiContext, viewer, createFunc);
        }));
    }

}

export namespace GeoCanvasPoi {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        enabled: true,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 必须是3的倍数！A Property specifying the array of Cartesian3 positions that define the line strip.
        positionEditing: false,
        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,
        zOrder: 0,
    });
}
extendClassProps(GeoCanvasPoi.prototype, GeoCanvasPoi.createDefaultProps);
export interface GeoCanvasPoi extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoCanvasPoi.createDefaultProps>> { }

class CanvasPoiCreating extends Destroyable {
    czmCanvasPoi: CzmCanvasPoi<CanvasPoi>;
    constructor(
        sceneObject: GeoCanvasPoi,
        canvasPoiClass: new (canvasPrimitivesContext: CanvasPrimitivesContext) => CanvasPoi,
        poiContext: CzmPoisContext,
        viewer: Cesium.Viewer,
        createFunc: (canvasPoi: CanvasPoi, visibleAlphaChanged?: Listener<[number, number]>) => Destroyable,
    ) {
        super();

        const czmCanvasPoi = this.czmCanvasPoi = this.disposeVar(new CzmCanvasPoi(canvasPoiClass, poiContext));
        this.disposeVar(createFunc(czmCanvasPoi.canvasPoi, sceneObject.visibleAlphaChanged));

        // const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
        //     sceneObject.showChanged,
        //     sceneObject.positionChanged,
        // ));
        // const updatePrimitive = () => {
        //     czmCanvasPoi.show = (sceneObject.show ?? true) && !!sceneObject.position;
        //     if (sceneObject.position) {
        //         czmCanvasPoi.cartesian = positionToCartesian(sceneObject.position);
        //     }
        // }
        // updatePrimitive();
        // this.dispose(updateEvent.disposableOn(updatePrimitive));

        {
            const update = () => {
                if (!sceneObject.position) return;
                czmCanvasPoi.cartesian = positionToCartesian(sceneObject.position);
            };
            update();
            this.dispose(sceneObject.positionChanged.disposableOn(update));
        }

        {
            const update = () => {
                czmCanvasPoi.show = (sceneObject.show ?? true) && !!sceneObject.position && (sceneObject.visibleAlpha > 0);
            }
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.positionChanged,
                sceneObject.visibleAlphaChanged,
            ));
            this.dispose(event.disposableOn(update));
        }

        this.dispose(sceneObject.flyToEvent.disposableOn(() => {
            if (!sceneObject.position) {
                console.warn(`GeoPoint当前没有位置信息，无法飞入！`);
                return;
            }
            let viewDistance = 1000;
            // let viewDistance = viewer.scene.camera.positionCartographic.height;
            if (sceneObject.viewDistanceRange) {
                const [n0, n1, f1, f0] = sceneObject.viewDistanceRange;
                viewDistance = (n1 + f1) * .5;
            }
            flyTo(viewer, sceneObject.position, viewDistance, undefined, 1000);
        }));
    }
}
