import { ESJVector4D, PickedInfo } from "earthsdk3";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactPositionsSet, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { positionsToUniqueCartesians, toColor } from "../../../../utils";

export class CzmPolylinesPrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _primitive?: Cesium.Primitive;
    private _boundingSphere?: Cesium.BoundingSphere;

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) return;

        // 销毁时，viewer移除图元
        const clear = () => {
            this._primitive && viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
        }
        this.ad(clear)

        // 绑定属性响应
        {
            const updateShow = () => {
                this._primitive && (this._primitive.show = (this.show ?? true));
            }
            updateShow();
            this.ad(this.showChanged.don(updateShow));
            const update = () => {
                clear();
                if (!this.positions) {
                    this._boundingSphere = undefined;
                    return;
                }
                const cartesianSet = this.positions.map(positionsToUniqueCartesians);
                // 创建图元
                this._primitive = createPrimitive(cartesianSet);
                this._primitive && viewer.scene.primitives.add(this._primitive);
                // 更新show
                updateShow();
                // 更新包围盒
                const cartesians: Cesium.Cartesian3[] = [];
                const l = cartesianSet.length;
                for (let i = 0; i < l; i++) {
                    const l2 = cartesianSet[i].length;
                    for (let j = 0; j < l2; j++) {
                        cartesians.push(cartesianSet[i][j]);
                    }
                }
                this._boundingSphere = cartesians ? Cesium.BoundingSphere.fromPoints(cartesians) : undefined;
            }
            update()
            const event = this.ad(createNextAnimateFrameEvent(
                this.widthChanged,
                this.hasDashChanged,
                this.hasArrowChanged,
                this.colorChanged,
                this.gapColorChanged,
                this.dashLengthChanged,
                this.dashPatternChanged,
                this.arcTypeChanged,
                this.positionsChanged,
                this.depthTestChanged,
                this.allowPickingChanged,
            ))
            this.ad(event.don(update));
            this.ad(this.flyToEvent.don(() => {
                if (!czmViewer.actived) return;
                event.flush();
                this._boundingSphere && viewer.camera.flyToBoundingSphere(this._boundingSphere);
            }))
        }
        const scratchColor_createPrimitive = new Cesium.Color();
        const scratchGapColor_createPrimitive = new Cesium.Color();
        const createMaterial = () => {
            let Material: Cesium.Material;
            if (this.hasArrow) {
                Material = Cesium.Material.fromType('PolylineArrow');
                Material.uniforms.color = toColor(this.color ?? [1, 1, 1, 1], scratchColor_createPrimitive);
            } else if (this.hasDash) {
                Material = Cesium.Material.fromType('PolylineDash');
                Material.uniforms.color = toColor(this.color ?? [1, 1, 1, 1], scratchColor_createPrimitive);
                Material.uniforms.gapColor = toColor(this.gapColor ?? [0, 0, 0, 0], scratchGapColor_createPrimitive);
                Material.uniforms.dashLength = this.dashLength ?? 16;
                Material.uniforms.dashPattern = this.dashPattern ?? 255;
            } else {
                Material = Cesium.Material.fromType('Color');
                Material.uniforms.color = toColor(this.color ?? [1, 1, 1, 1], scratchColor_createPrimitive);
            }
            return Material;
        }
        const createPrimitive = (cartesiansSet: Cesium.Cartesian3[][]) => {
            const appearance = new Cesium.PolylineMaterialAppearance({
                material: createMaterial(),
                renderState: {
                    depthTest: {
                        enabled: this.depthTest ?? false,
                    },
                },
            });
            appearance.renderState.depthMask = false;

            const geometryInstances: Cesium.GeometryInstance[] = [];
            for (let i = 0; i < cartesiansSet.length; ++i) {
                const cartesians = cartesiansSet[i];
                if (cartesians.length < 2) {
                    continue;
                }
                geometryInstances.push(new Cesium.GeometryInstance({
                    geometry: new Cesium.PolylineGeometry({
                        positions: cartesians,
                        width: this.width ?? 1,
                        vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType[this.arcType ?? 'GEODESIC'],
                    }),
                    id: this,
                }));
            }

            if (geometryInstances.length === 0) {
                return undefined;
            }

            const primitive = new Cesium.Primitive({
                geometryInstances,
                appearance,
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking,
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            Cesium.Primitive.prototype && (primitive.ESSceneObjectID = id);
            return primitive;
        }
    }
}

export namespace CzmPolylinesPrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: undefined as boolean | undefined,
        positions: reactPositionsSet(undefined), // 必须是3的倍数！A Property specifying the array of Cartesian3 positions that define the line strip.
        width: undefined as number | undefined, // undfined时为1.0，A numeric Property specifying the width in pixels.
        color: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined), // default [1, 1, 1, 1]
        hasDash: undefined as boolean | undefined,
        gapColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined), // default [0, 0, 0, 0]
        dashLength: undefined as number | undefined, // default 16
        dashPattern: undefined as number | undefined, // default 255
        hasArrow: undefined as boolean | undefined,
        arcType: undefined as 'NONE' | 'GEODESIC' | 'RHUMB' | undefined,
        depthTest: undefined as boolean | undefined,
    });
}
extendClassProps(CzmPolylinesPrimitive.prototype, CzmPolylinesPrimitive.createDefaultProps);
export interface CzmPolylinesPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolylinesPrimitive.createDefaultProps>> { }
