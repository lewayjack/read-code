import { PickedInfo } from "earthsdk3";
import { PositionsEditing } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmArcType, CzmMaterialJsonType } from "../../../../ESJTypesCzm";
import { createMaterialRef, flyTo, positionFromCartesian, positionsToUniqueCartesians } from "../../../../utils";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, ReactivePropsToNativePropsAndChanged, reactJson, reactPositions, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';

export class CzmPolylineGroundPrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], false, [this, 'editing'], czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const materialRef = this.disposeVar(createMaterialRef([this, 'material']));

        const createPrimitive = (cartesians: Cesium.Cartesian3[], material: Cesium.Material) => {
            const appearance = new Cesium.PolylineMaterialAppearance({
                material: material,
                renderState: {
                    depthTest: {
                        enabled: this.depthTest ?? false,
                        // enabled: false,
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

            // vtxf 20230615
            // polyline.arcType 有可能是"NONE" | "GEODESIC" | "RHUMB" | undefined 四值之一
            // 但是内贴地折线不能是NONE模式，如果客户指定为NONE则使用GEODESIC绘制
            // 如果是undefined，则默认用GEODESIC绘制
            // 所以最后的结果就是只要不是RHUMB，就一律用GEODESIC
            if (this.arcType === 'NONE') {
                console.warn(`贴地折线不能使用NONE模式，如果客户设定为此模式，则强制使用GEODESIC模式来处理！`);
            }
            const arcType = this.arcType !== 'RHUMB' ? 'GEODESIC' : 'RHUMB';

            geometryInstances.push(new Cesium.GeometryInstance({
                geometry: new Cesium.GroundPolylineGeometry({
                    positions: cartesians,
                    width: this.width,
                    // @ts-ignore
                    vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
                    // arcType: Cesium.ArcType.RHUMB, // 会导致z轴忽隐忽现
                    // arcType: Cesium.ArcType.GEODESIC,
                    // @ts-ignore
                    arcType: Cesium.ArcType[arcType],
                }),
                id: this,
            }));

            const primitive = new Cesium.GroundPolylinePrimitive({
                geometryInstances,
                appearance,
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking, // 不允许拾取
                // @ts-ignore
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            Cesium.GroundPolylinePrimitive.prototype && (primitive.ESSceneObjectID = id)
            return primitive;
        }

        let primitive: Cesium.GroundPolylinePrimitive | undefined;
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

            if (!(this.show ?? true)) {
                return;
            }

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

            recreateEvent.flush();
            updateEvent.flush();

            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmPolylineGroundPrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: undefined as boolean | undefined,
        positions: reactPositions(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        width: undefined as number | undefined, // undfined时为1.0，A numeric Property specifying the width in pixels.
        arcType: undefined as CzmArcType | undefined,
        material: reactJson({ type: 'Color' } as CzmMaterialJsonType),
        editing: undefined as boolean | undefined,
        depthTest: undefined as boolean | undefined, // 地形深度检测
    });
}
extendClassProps(CzmPolylineGroundPrimitive.prototype, CzmPolylineGroundPrimitive.createDefaultProps);
export interface CzmPolylineGroundPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolylineGroundPrimitive.createDefaultProps>> { }
