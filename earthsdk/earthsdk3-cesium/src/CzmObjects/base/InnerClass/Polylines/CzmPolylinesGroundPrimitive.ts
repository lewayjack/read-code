import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactPositionsSet, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { positionsToUniqueCartesians, toColor } from "../../../../utils";

export class CzmPolylinesGroundPrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _groundPrimitive?: Cesium.GroundPolylinePrimitive;
    private _boundingSphere?: Cesium.BoundingSphere;

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        // 清除
        const clear = () => {
            this._groundPrimitive && viewer.scene.primitives.remove(this._groundPrimitive);
            this._groundPrimitive = undefined;
        }
        this.ad(clear);
        {
            // 绑定属性
            const createPolyline = () => {
                clear();
                if (!(this.show ?? true) || !this.positions) return;
                // 添加图元
                const cartesiansSet = this.positions.map(positionsToUniqueCartesians);
                this._groundPrimitive = createGroundPrimitive(cartesiansSet);
                this._groundPrimitive && viewer.scene.groundPrimitives.add(this._groundPrimitive);

                this._groundPrimitive && (this._groundPrimitive.show = (this.show ?? true));

                const boundingSphere_updateBoundingSphere: Cesium.BoundingSphere = new Cesium.BoundingSphere();
                if (!cartesiansSet) {
                    this._boundingSphere = undefined;
                    return;
                }

                const cartesians: Cesium.Cartesian3[] = [];
                const l = cartesiansSet.length;
                for (let i = 0; i < l; ++i) {
                    const l2 = cartesiansSet[i].length;
                    for (let j = 0; j < l2; ++j) {
                        cartesians.push(cartesiansSet[i][j]);
                    }
                }
                this._boundingSphere = cartesians ? Cesium.BoundingSphere.fromPoints(cartesians, boundingSphere_updateBoundingSphere) : undefined;
            }
            createPolyline();
            const event = this.ad(createNextAnimateFrameEvent(
                this.showChanged,
                this.positionsChanged,
                this.widthChanged,
                this.hasDashChanged,
                this.hasArrowChanged,
                this.colorChanged,
                this.gapColorChanged,
                this.dashLengthChanged,
                this.dashPatternChanged,
                this.arcTypeChanged,
                this.depthTestChanged,
                this.allowPickingChanged,
            ))
            this.ad(event.don(createPolyline));
            this.dispose(this.flyToEvent.disposableOn(() => {
                if (!czmViewer.actived) return;
                event.flush();
                this._boundingSphere && viewer.camera.flyToBoundingSphere(this._boundingSphere);
            }));
        }

        const scratchColor_createPrimitive = new Cesium.Color();
        const scratchGapColor_createPrimitive = new Cesium.Color();
        const createGroundPrimitive = (cartesiansSet: Cesium.Cartesian3[][]) => {
            const geometryInstances: Cesium.GeometryInstance[] = [];
            for (let i = 0; i < cartesiansSet.length; ++i) {
                const cartesians = cartesiansSet[i];
                if (cartesians.length < 2) {
                    continue;
                }
                geometryInstances.push(new Cesium.GeometryInstance({
                    geometry: new Cesium.GroundPolylineGeometry({
                        positions: cartesians,
                        width: this.width ?? 1,
                        // @ts-ignore
                        vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType[this.arcType ?? 'GEODESIC'],
                    }),
                    id: this,
                }));
            }

            if (geometryInstances.length === 0) {
                return undefined;
            }
            const groundPrimitive = new Cesium.GroundPolylinePrimitive({
                geometryInstances,
                appearance: new Cesium.PolylineMaterialAppearance({
                    material: createMaterial(),
                    renderState: {
                        depthTest: {
                            enabled: this.depthTest ?? false,
                        },
                    },
                }),
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking,
                // @ts-ignore
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            Cesium.GroundPolylinePrimitive.prototype && (groundPrimitive.ESSceneObjectID = id);
            return groundPrimitive;
        }
        const createMaterial = () => {
            let material: Cesium.Material;
            if (this.hasArrow) {
                material = Cesium.Material.fromType("PolylineArrow");
                material.uniforms.color = toColor(this.color ?? [1, 1, 1, 1], scratchColor_createPrimitive);
            } else if (this.hasDash) {
                material = Cesium.Material.fromType("PolylineDash");
                material.uniforms.color = toColor(this.color ?? [1, 1, 1, 1], scratchGapColor_createPrimitive);
                material.uniforms.gapColor = toColor(this.gapColor ?? [0, 0, 0, 0], scratchGapColor_createPrimitive);
                material.uniforms.dashLength = this.dashLength ?? 16;
                material.uniforms.dashPattern = this.dashPattern ?? 255;
            } else {
                material = Cesium.Material.fromType("Color");
                material.uniforms.color = toColor(this.color ?? [1, 1, 1, 1], scratchColor_createPrimitive);
            }
            return material;
        }
    }
}

export namespace CzmPolylinesGroundPrimitive {
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
extendClassProps(CzmPolylinesGroundPrimitive.prototype, CzmPolylinesGroundPrimitive.createDefaultProps);
export interface CzmPolylinesGroundPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolylinesGroundPrimitive.createDefaultProps>> { }

