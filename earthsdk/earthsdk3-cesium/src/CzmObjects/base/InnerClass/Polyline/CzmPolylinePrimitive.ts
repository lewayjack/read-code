import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmArcType, CzmMaterialJsonType } from "./../../../../ESJTypesCzm";
import { createMaterialRef, flyTo, positionFromCartesian, positionsToUniqueCartesians } from "../../../../utils";
import { createGuid, createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, react, ReactivePropsToNativePropsAndChanged, reactJson, reactPositions, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';

export class CzmPolylinePrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const materialRef = this.disposeVar(createMaterialRef([this, 'material']));

        const createPrimitive = (cartesians: Cesium.Cartesian3[], material: Cesium.Material) => {
            const appearance = new Cesium.PolylineMaterialAppearance({
                material: material,
                renderState: {
                    depthTest: {
                        enabled: this.depthTest ?? false,
                    },
                    // depthMask: this.depthMask, 设置无效，Appearance内部会强行设置
                },
                // translucent: this.forceTranslucent, // 这里的设置同样无效，因为material强制控制是否透明
            });
            appearance.renderState.depthMask = false;

            const geometryInstances: Cesium.GeometryInstance[] = [];

            if (cartesians.length < 2) {
                return undefined;
            }
            geometryInstances.push(new Cesium.GeometryInstance({
                geometry: new Cesium.PolylineGeometry({
                    positions: cartesians,
                    width: this.width,
                    vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
                    // @ts-ignore
                    arcType: this.arcType && Cesium.ArcType[this.arcType],
                }),
                id: this,
            }));

            const primitive = new Cesium.Primitive({
                geometryInstances,
                appearance,
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking, // 不允许拾取
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            Cesium.Primitive.prototype && (primitive.ESSceneObjectID = id)
            return primitive;
        }

        let primitive: Cesium.Primitive | undefined;
        const boundingSphere = new Cesium.BoundingSphere();

        const resetPrimitive = () => {
            if (!primitive) {
                return;
            }
            viewer.scene.primitives.remove(primitive);
            primitive = undefined;
        };
        this.dispose(resetPrimitive);

        const recreatePolyline = () => {
            resetPrimitive();

            if (!this.positions) {
                return;
            }

            const cartesians = positionsToUniqueCartesians(this.positions);
            if (cartesians.length < 2 || !materialRef.value) {
                boundingSphere.radius = -1;
                return;
            }

            Cesium.BoundingSphere.fromPoints(cartesians, boundingSphere);
            primitive = createPrimitive(cartesians, materialRef.value);
            primitive && viewer.scene.primitives.add(primitive);
        }

        const updatePolyline = () => {
            if (!primitive) {
                return;
            }
            primitive.show = this.show ?? true;
        };

        recreatePolyline();
        updatePolyline();

        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.positionsChanged,
            this.widthChanged,
            materialRef.changed,
            this.arcTypeChanged,
            this.allowPickingChanged,
            this.depthTestChanged,
        ));
        this.dispose(recreateEvent.disposableOn(() => {
            recreatePolyline();
            updatePolyline();
        }));

        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.showChanged,

        ));
        this.dispose(updateEvent.disposableOn(() => {
            updatePolyline();
        }));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }

            updateEvent.flush();
            recreateEvent.flush();

            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmPolylinePrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: undefined as boolean | undefined,
        positions: reactPositions(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        width: undefined as number | undefined, // undfined时为1.0，A numeric Property specifying the width in pixels.
        arcType: undefined as CzmArcType | undefined,
        material: reactJson({ type: 'Color' } as CzmMaterialJsonType),
        depthTest: undefined as boolean | undefined, //地形深度检测
    });
}
extendClassProps(CzmPolylinePrimitive.prototype, CzmPolylinePrimitive.createDefaultProps);
export interface CzmPolylinePrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolylinePrimitive.createDefaultProps>> { }
