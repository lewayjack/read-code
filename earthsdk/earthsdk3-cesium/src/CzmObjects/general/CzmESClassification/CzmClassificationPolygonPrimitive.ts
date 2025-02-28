import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { CzmClassificationType, czmPropMaps, PolygonHierarchyType } from "../../../ESJTypesCzm";
import { Destroyable, Listener, Event, reactArrayWithUndefined, reactJson, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, ObjResettingWithEvent, HasOwner, SceneObjectKey, react, createGuid } from "xbsj-base";
import * as Cesium from 'cesium';
import { createPolygonHierarchy, flyTo, positionFromCartesian, positionsToUniqueCartesians, toEllipsoid } from "../../../utils";

export class CzmClassificationPolygonPrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        color: [1, 1, 1, .5] as [number, number, number, number],
    };


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
        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.polygonHierarchyChanged,
            this.colorChanged,
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
            this.classificationTypeChanged,
        ));
        this.disposeVar(new ObjResettingWithEvent(recreateEvent, () => {
            if (!this.polygonHierarchy) return undefined;
            return new PrimitiveWrapper(this, czmViewer);
        }));

        const boundingSphere = new Cesium.BoundingSphere();
        {
            const update = () => {
                if (!this.polygonHierarchy) return;
                const cartesians = positionsToUniqueCartesians(this.polygonHierarchy.positions);
                if (cartesians.length < 3) {
                    boundingSphere.radius = -1;
                    return;
                }
                Cesium.BoundingSphere.fromPoints(cartesians, boundingSphere);
            };
            update();
            this.polygonHierarchyChanged.disposableOn(update);
        }
        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }
            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmClassificationPolygonPrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        allowPicking: undefined as boolean | undefined,
        arcType: undefined as 'NONE' | 'GEODESIC' | 'RHUMB' | undefined,
        color: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        stRotation: undefined as number | undefined,
        polygonHierarchy: reactJson({ positions: [] } as PolygonHierarchyType),//TODO
        height: undefined as number | undefined,
        extrudedHeight: undefined as number | undefined,
        ellipsoid: undefined as [x: number, y: number, z: number] | undefined,//TODO
        granularity: undefined as number | undefined,
        perPositionHeight: undefined as boolean | undefined,
        closeTop: undefined as boolean | undefined,
        closeBottom: undefined as boolean | undefined,
        classificationType: 'BOTH' as CzmClassificationType,
        // textureCoordinates: reactJson({ positions: [] } as PolygonHierarchyType),//TODE
    });
}
extendClassProps(CzmClassificationPolygonPrimitive.prototype, CzmClassificationPolygonPrimitive.createDefaultProps);
export interface CzmClassificationPolygonPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmClassificationPolygonPrimitive.createDefaultProps>> { }

class PrimitiveWrapper extends HasOwner<CzmClassificationPolygonPrimitive> {
    constructor(owner: CzmClassificationPolygonPrimitive, czmViewer: ESCesiumViewer) {
        super(owner);
        if (!czmViewer) throw new Error(`!czmViewer`);
        const sceneObject = this.owner;
        if (!sceneObject.polygonHierarchy) {
            throw new Error('polygonHierarchy is required');
        }

        const geometryInstances: Cesium.GeometryInstance[] = [];

        const polygonInstance = new Cesium.GeometryInstance({
            geometry: new Cesium.PolygonGeometry({
                vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
                polygonHierarchy: createPolygonHierarchy(sceneObject.polygonHierarchy),
                stRotation: sceneObject.stRotation && Cesium.Math.toRadians(sceneObject.stRotation),
                arcType: sceneObject.arcType && Cesium.ArcType[sceneObject.arcType],
                height: sceneObject.height,
                extrudedHeight: sceneObject.extrudedHeight,
                perPositionHeight: sceneObject.perPositionHeight,
                closeTop: sceneObject.closeTop,
                closeBottom: sceneObject.closeBottom,
                ellipsoid: sceneObject.ellipsoid && toEllipsoid(sceneObject.ellipsoid),
                granularity: sceneObject.granularity !== undefined ? Cesium.Math.toRadians(sceneObject.granularity) : undefined,
                // textureCoordinates	PolygonHierarchy		optionalTexture coordinates as a PolygonHierarchy of Cartesian2 points.Has no effect for ground primitives.
            }),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    new Cesium.Color(...(sceneObject.color ?? CzmClassificationPolygonPrimitive.defaults.color))
                ),
                show: new Cesium.ShowGeometryInstanceAttribute(true),
            },
            id: this,
        });
        geometryInstances.push(polygonInstance);

        const primitive = new Cesium.ClassificationPrimitive({
            geometryInstances,
            // appearance,
            asynchronous: false, // 防止闪烁
            allowPicking: sceneObject.allowPicking,
            compressVertices: false, // 提升效率
            classificationType: czmPropMaps.classificationTypeMap[sceneObject.classificationType],
        });
        //@ts-ignore
        Cesium.ClassificationPrimitive.prototype && (primitive.ESSceneObjectID = owner.id)

        {
            if (!czmViewer) {
                throw new Error(`!this.owner.czmViewer`);
            }
            const { viewer } = czmViewer;
            if (!viewer) {
                throw new Error(`!czmViewer.viewer`);
            }
            viewer.scene.primitives.add(primitive);
            this.dispose(() => viewer.scene.primitives.remove(primitive));
        }

        {
            const update = () => {
                primitive.show = sceneObject.show ?? true;
            };
            update();
            this.dispose(sceneObject.showChanged.disposableOn(update));
        }
    }
}
