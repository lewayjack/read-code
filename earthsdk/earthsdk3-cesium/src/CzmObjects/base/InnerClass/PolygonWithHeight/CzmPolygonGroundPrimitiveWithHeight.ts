import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer, getViewerExtensions } from "../../../../ESCesiumViewer";
import { CzmMaterialJsonType, PolygonHierarchyType } from "../../../../ESJTypesCzm";
import { createMaterialRef, createPolygonHierarchy, flyTo, positionFromCartesian, positionsToUniqueCartesians, toEllipsoid } from "../../../../utils";
import * as Cesium from "cesium";
import { Destroyable, Listener, Event, reactJson, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, ObjResettingWithEvent, SceneObjectKey, createGuid, react } from "xbsj-base";

export class CzmPolygonGroundPrimitiveWithHeight extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }
    private _primitive?: Cesium.GroundPrimitive;

    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const extensions = getViewerExtensions(czmViewer.viewer);
        if (!extensions) {
            return;
        }

        const materialRef = this.disposeVar(createMaterialRef([this, 'material']));
        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.polygonHierarchyChanged,
            this.materialChanged,
            this.stRotationChanged,
            this.arcTypeChanged,
            this.heightChanged,
            this.extrudedHeightChanged,
            this.perPositionHeightChanged,
            this.closeTopChanged,
            this.closeBottomChanged,
            this.ellipsoidChanged,
            this.granularityChanged,
            this.allowPickingChanged,
            materialRef.changed,
        ));

        const gpwResetting = this.disposeVar(new ObjResettingWithEvent(recreateEvent, () => {
            if (!materialRef.value) return undefined;
            return new GroundPrimitiveWrapper(czmViewer, viewer, this, materialRef.value);
        }));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }
            recreateEvent.flush();
            gpwResetting.obj && gpwResetting.obj.flyTo(duration);
        }));
    }
}

export namespace CzmPolygonGroundPrimitiveWithHeight {
    export const createDefaultProps = () => ({
        show: true,
        allowPicking: false,
        arcType: 'GEODESIC' as 'NONE' | 'GEODESIC' | 'RHUMB',
        material: reactJson({ type: 'Color' } as CzmMaterialJsonType),//TODO
        stRotation: 0,
        polygonHierarchy: reactJson({ positions: [] } as PolygonHierarchyType),//TODO
        height: undefined as number | undefined,
        extrudedHeight: undefined as number | undefined,
        ellipsoid: undefined as [x: number, y: number, z: number] | undefined,//TODO
        granularity: 1,
        perPositionHeight: false,
        closeTop: true,
        closeBottom: true,
        // textureCoordinates: { positions: [] } as PolygonHierarchyType,//TODO czm不存在textureCoordinates参数，文档可查到
    });
}
extendClassProps(CzmPolygonGroundPrimitiveWithHeight.prototype, CzmPolygonGroundPrimitiveWithHeight.createDefaultProps);
export interface CzmPolygonGroundPrimitiveWithHeight extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolygonGroundPrimitiveWithHeight.createDefaultProps>> { }

class GroundPrimitiveWrapper extends Destroyable {
    private _boundingSphere = (() => {
        const polygon = this._sceneObject;
        const material = this._material;

        const boundingSphere = new Cesium.BoundingSphere();

        if (!polygon.polygonHierarchy) return;
        const cartesians = positionsToUniqueCartesians(polygon.polygonHierarchy.positions);

        if (cartesians.length < 3) {
            boundingSphere.radius = -1;
            return undefined;
        }
        Cesium.BoundingSphere.fromPoints(cartesians, boundingSphere);
        return boundingSphere;
    })();
    constructor(
        private _czmViewer: ESCesiumViewer,
        private _viewer: Cesium.Viewer,
        private _sceneObject: CzmPolygonGroundPrimitiveWithHeight,
        private _material: Cesium.Material
    ) {
        super();
        const polygon = this._sceneObject;
        const material = this._material;
        const viewer = this._viewer;

        if (!polygon.polygonHierarchy) {
            return
        }
        // appearance
        const appearance = new Cesium.MaterialAppearance({
            material: material,
        })

        const geometryInstances: Cesium.GeometryInstance[] = [];

        const polygonInstance = new Cesium.GeometryInstance({
            geometry: new Cesium.PolygonGeometry({
                vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
                polygonHierarchy: createPolygonHierarchy(polygon.polygonHierarchy),
                stRotation: polygon.stRotation && Cesium.Math.toRadians(polygon.stRotation),
                arcType: polygon.arcType && Cesium.ArcType[polygon.arcType],
                height: polygon.height,
                extrudedHeight: polygon.extrudedHeight,
                perPositionHeight: polygon.perPositionHeight,
                closeTop: polygon.closeTop,
                closeBottom: polygon.closeBottom,
                ellipsoid: polygon.ellipsoid && toEllipsoid(polygon.ellipsoid),
                granularity: polygon.granularity !== undefined ? Cesium.Math.toRadians(polygon.granularity) : undefined,
                // textureCoordinates	PolygonHierarchy		optionalTexture coordinates as a PolygonHierarchy of Cartesian2 points.Has no effect for ground primitives.
            }),
            id: this,
        });
        geometryInstances.push(polygonInstance);

        const groundPrimitive = new Cesium.GroundPrimitive({
            geometryInstances: geometryInstances,
            appearance,
            asynchronous: false, // 防止闪烁
            allowPicking: polygon.allowPicking, // 不允许拾取
            compressVertices: false, // 提升效率
        })
        //@ts-ignore
        Cesium.GroundPrimitive.prototype && (groundPrimitive.ESSceneObjectID = _sceneObject.id);
        viewer.scene.primitives.add(groundPrimitive);
        this.dispose(() => viewer.scene.primitives.remove(groundPrimitive));

        {
            const update = () => {
                groundPrimitive.show = polygon.show;
            };
            update();
            this.dispose(polygon.showChanged.disposableOn(update));
        }

        this.disposeVar(new ESCesiumViewer.ObjectsToExcludeWrapper(this._czmViewer, groundPrimitive));
    }

    flyTo(duration?: number) {
        const bs = this._boundingSphere;
        if (!bs) return;
        if (bs.radius > 0) {
            const target = positionFromCartesian(bs.center);
            target && flyTo(this._viewer, target, bs.radius * 4.0, undefined, duration);
        }
    }
}
