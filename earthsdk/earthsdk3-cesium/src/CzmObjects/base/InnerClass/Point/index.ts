import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, ObjResettingWithEvent, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { flyTo, positionToCartesian, toColor, toDistanceDisplayCondition, toNearFarScalar } from "../../../../utils";
import { PositionEditing } from "../../../../CzmObjects";

export class CzmPoint extends Destroyable {
    static defaults = {
        pixelSize: 1,
        outlineWidth: 1,
        color: [1, 1, 1, .5] as [number, number, number, number],
        outlineColor: [1, 1, 1, 1] as [number, number, number, number],
    };
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionEditing: PositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    private _updateObjectsToExcludeWrapper = this.ad(new Event());

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'editing'], czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) return;

        const pointPrimitives = new Cesium.PointPrimitiveCollection();
        let pointPrimitive: Cesium.PointPrimitive | undefined;
        {
            //清除
            const clean = () => {
                if (pointPrimitives) {
                    if (pointPrimitive)
                        pointPrimitives.remove(pointPrimitive);
                    viewer.scene.primitives.remove(pointPrimitives);
                    pointPrimitive = undefined;
                }

            }
            this.ad(clean);
            // 有的话先销毁
            clean();
            pointPrimitive = pointPrimitives.add({});
            //@ts-ignore
            Cesium.PointPrimitive.prototype && (pointPrimitive.ESSceneObjectID = id)
            viewer.scene.primitives.add(pointPrimitives);
        }
        {
            const event = this.ad(createNextAnimateFrameEvent(
                this.positionChanged,
                this.showChanged,
                this.pixelSizeChanged,
                this.colorChanged,
                this.outlineColorChanged,
                this.outlineWidthChanged,
                this.distanceDisplayConditionChanged,
                this.scaleByDistanceChanged,
                this.translucencyByDistanceChanged
            ))
            const update = () => {
                if (!pointPrimitive || !pointPrimitives) return;
                pointPrimitive.show = (this.show ?? true) && !!this.position;
                this.position && (pointPrimitive.position = positionToCartesian(this.position));
                pointPrimitive.pixelSize = this.pixelSize ?? 1;
                pointPrimitive.color = toColor(this.color ?? CzmPoint.defaults.color);
                this.distanceDisplayCondition && (pointPrimitive.distanceDisplayCondition = toDistanceDisplayCondition(this.distanceDisplayCondition));
                pointPrimitive.outlineColor = toColor(this.outlineColor ?? CzmPoint.defaults.outlineColor);
                pointPrimitive.outlineWidth = this.outlineWidth ?? CzmPoint.defaults.outlineWidth;
                this.scaleByDistance && (pointPrimitive.scaleByDistance = toNearFarScalar(this.scaleByDistance));
                this.translucencyByDistance && (pointPrimitive.translucencyByDistance = toNearFarScalar(this.translucencyByDistance));
            }
            update();
            this.ad(event.don(update));
        }
        {
            // 是否允许点击
            const event = this.ad(createNextAnimateFrameEvent(this._updateObjectsToExcludeWrapper, this.allowPickingChanged))
            this.disposeVar(new ObjResettingWithEvent(event, () => {
                if (this.allowPicking || !pointPrimitive) return undefined;
                return new ESCesiumViewer.ObjectsToExcludeWrapper(czmViewer, pointPrimitive);
            }));
        }
        {
            // 飞行
            this.ad(this.flyToEvent.don((duration) => {
                if (!this.position) {
                    console.warn('没有位置信息，无法飞行');
                    return;
                }
                const viewerDistance = viewer.scene.camera.positionCartographic.height;
                flyTo(viewer, this.position, viewerDistance, undefined, duration);
            }))
        }
    }
}
// 绑定属性
export namespace CzmPoint {
    export const createDefaultProps = () => ({
        editing: false,
        show: undefined as boolean | undefined, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 必须是3的倍数！A Property specifying the array of Cartesian3 positions that define the line strip.
        pixelSize: undefined as number | undefined, // undfined时为1.0，A numeric Property specifying the width in pixels.
        color: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined), // default [1, 1, 1, 1]
        distanceDisplayCondition: undefined as [number, number] | undefined,
        disableDepthTestDistance: undefined as number | undefined,
        outlineColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined), // Color} [outlineColor=Color.BLACK] A Property specifying the {@link Color} of the outline.
        outlineWidth: undefined as number | undefined,
        scaleByDistance: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        translucencyByDistance: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
    })
}
extendClassProps(CzmPoint.prototype, CzmPoint.createDefaultProps);
export interface CzmPoint extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPoint.createDefaultProps>> { }
