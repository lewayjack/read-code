import { ESSceneObject, PickedInfo } from "earthsdk3";
import { PositionsEditing, XbsjGroundPolylinePrimitive } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, Listener, Event, reactPositions, extendClassProps, ReactivePropsToNativePropsAndChanged, react, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { flyTo, positionFromCartesian, positionsToUniqueCartesians, toCartesian2 } from "../../../utils";

export class CzmRoad extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    static defaults = {
        show: true,
        positions: [],
        width: 50,
        arcType: 'GEODESIC',
        imageUrl: '${earthsdk3-assets-script-dir}/assets/img/roads/4.jpg',
        repeat: [100, 1] as [number, number],
        editing: false,
        allowPicking: false,
    };

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], false, [this, 'editing'], czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const imageUrlReact = ESSceneObject.context.createEnvStrReact([this, 'imageUrl'], CzmRoad.defaults.imageUrl);

        // const materialRef = this.disposeVar(createMaterialRef([polyline, 'material']));
        const materialRef = this.disposeVar(react<Cesium.Material | undefined>(undefined));
        const updateMaterial = () => {
            const material = Cesium.Material.fromType(Cesium.Material.ImageType);
            // material.uniforms.image = 'https://www.baidu.com/img/bd_logo1.png?where=super';
            material.uniforms.image = imageUrlReact.value;
            material.uniforms.repeat = toCartesian2(this.repeat ?? CzmRoad.defaults.repeat);
            materialRef.value = material;
        };
        updateMaterial();
        const updateMaterialEvent = this.disposeVar(createNextAnimateFrameEvent(imageUrlReact.changed, this.repeatChanged));
        this.dispose(updateMaterialEvent.disposableOn(updateMaterial));

        const createPrimitive = (cartesians: Cesium.Cartesian3[], material: Cesium.Material) => {
            const appearance = new Cesium.PolylineMaterialAppearance({
                material: material,
                renderState: {
                    depthTest: {
                        // enabled: polyline.depthTest,
                        enabled: false,
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
                geometry: new Cesium.GroundPolylineGeometry({
                    positions: cartesians,
                    width: this.width ?? CzmRoad.defaults.width,
                    // @ts-ignore
                    vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
                    // arcType: Cesium.ArcType.RHUMB, // 会导致z轴忽隐忽现
                    // arcType: Cesium.ArcType.GEODESIC,
                    // @ts-ignore
                    arcType: Cesium.ArcType[this.arcType ?? CzmRoad.defaults.arcType],
                }),
                id: this,
            }));

            const primitive = new XbsjGroundPolylinePrimitive({
                geometryInstances,
                appearance,
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking ?? CzmRoad.defaults.allowPicking, // 不允许拾取
                // @ts-ignore
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            primitive.ESSceneObjectID = id
            return primitive;
        }

        let primitive: XbsjGroundPolylinePrimitive | undefined;
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

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }

            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));

        recreatePolyline();
        updatePolyline();

        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.positionsChanged,
            this.widthChanged,
            materialRef.changed,
            this.arcTypeChanged,
            this.allowPickingChanged,
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

        const { extensions } = czmViewer;
        if (!extensions) { console.warn(`!extensions`); return }
    }
}

export namespace CzmRoad {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined, // boolean} [show=true] A boolean Property specifying the visibility
        positions: reactPositions(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        width: undefined as number | undefined, // undfined时为1.0，A numeric Property specifying the width in pixels.
        arcType: undefined as 'NONE' | 'GEODESIC' | 'RHUMB' | undefined,
        // material: reactJson({ type: 'Color' } as CzmMaterialJsonType),
        imageUrl: undefined as string | undefined,
        repeat: undefined as [number, number] | undefined,
        editing: undefined as boolean | undefined,
        allowPicking: undefined as boolean | undefined,
    });
}
extendClassProps(CzmRoad.prototype, CzmRoad.createDefaultProps);
export interface CzmRoad extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmRoad.createDefaultProps>> { }
