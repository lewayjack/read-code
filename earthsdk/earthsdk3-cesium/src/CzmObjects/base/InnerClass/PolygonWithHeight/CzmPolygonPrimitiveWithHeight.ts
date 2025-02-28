import { PickedInfo } from "earthsdk3";
import { PositionsEditing } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmMaterialJsonType, PolygonHierarchyType } from "../../../../ESJTypesCzm";
import { Destroyable, Listener, reactPositions, Event, reactJson, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";
import { createMaterialRef, createPolygonHierarchy, flyTo, positionFromCartesian, positionsToUniqueCartesians, toEllipsoid } from "../../../../utils";
import * as Cesium from 'cesium';
export class CzmPolygonPrimitiveWithHeight extends Destroyable {
    private _positions = this.disposeVar(reactPositions(undefined));
    get positions() { return this._positions.value; }
    get positionsChanged() { return this._positions.changed; }
    set positions(value: [number, number, number][] | undefined) { this._positions.value = value; }

    static defaults = {
        positions: [],
        editing: false
    };

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _primitive?: Cesium.Primitive;

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], true, [this, 'editing'], czmViewer));

        this.d(this.polygonHierarchyChanged.don(() => {
            if (this.polygonHierarchy) {
                this.positions = this.polygonHierarchy.positions;
            } else {
                this.positions = undefined;
            }

        }));
        this.d(this.positionsChanged.don(() => {
            if (this.positions) {
                this.polygonHierarchy.positions = [...this.positions]
            } else {
                this.polygonHierarchy = { positions: [] };
            }
        }));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const materialRef = this.disposeVar(createMaterialRef([this, 'material']));

        const removePrimitive = () => {
            if (!this._primitive) {
                return;
            }
            viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
        };
        this.dispose(removePrimitive);

        const createPrimitive = (material: Cesium.Material) => {
            if (!this.polygonHierarchy) {
                return undefined
            }
            // appearance
            const appearance = new Cesium.MaterialAppearance({
                material: material,
            })
            // geometryInstances[polygonInstance]
            const geometryInstances: Cesium.GeometryInstance[] = [];

            const polygonInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.PolygonGeometry({
                    vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
                    polygonHierarchy: createPolygonHierarchy(this.polygonHierarchy),
                    stRotation: this.stRotation && Cesium.Math.toRadians(this.stRotation),
                    arcType: this.arcType && Cesium.ArcType[this.arcType],
                    height: this.height,
                    extrudedHeight: this.extrudedHeight,
                    perPositionHeight: this.perPositionHeight,
                    closeTop: this.closeTop,
                    closeBottom: this.closeBottom,
                    ellipsoid: this.ellipsoid && toEllipsoid(this.ellipsoid),
                    granularity: this.granularity !== undefined ? Cesium.Math.toRadians(this.granularity) : undefined,
                    // textureCoordinates	PolygonHierarchy		optionalTexture coordinates as a PolygonHierarchy of Cartesian2 points.Has no effect for ground primitives.

                }),
                id: this,
            });
            geometryInstances.push(polygonInstance);

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
        const boundingSphere = new Cesium.BoundingSphere();


        const recreatePolygon = () => {
            removePrimitive()

            if (!this.polygonHierarchy) return;
            const cartesians = positionsToUniqueCartesians(this.polygonHierarchy.positions);

            if (cartesians.length < 3 || !materialRef.value) {
                boundingSphere.radius = -1;
                return;
            }

            Cesium.BoundingSphere.fromPoints(cartesians, boundingSphere);
            this._primitive = createPrimitive(materialRef.value);
            this._primitive && viewer.scene.primitives.add(this._primitive);
        }

        const updatePolygon = () => {
            const polygonShow = this.show ?? true;
            this._primitive && (this._primitive.show = polygonShow);
        };

        recreatePolygon();
        updatePolygon();

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

        this.dispose(recreateEvent.disposableOn(() => {
            recreatePolygon();
            updatePolygon();
        }));

        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.showChanged,
            // this.groundChanged,
        ));


        this.dispose(updateEvent.disposableOn(() => {
            updatePolygon();
        }));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }
            recreateEvent.flush();
            updateEvent.flush();
            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                const height = this.height ?? 0;
                const extrudedHeight = this.extrudedHeight ?? 0;
                const maxHeight = Math.max(height, extrudedHeight);
                const radius = boundingSphere.radius < maxHeight ? maxHeight : boundingSphere.radius;
                target && flyTo(viewer, target, radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmPolygonPrimitiveWithHeight {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        allowPicking: undefined as boolean | undefined,
        arcType: undefined as 'NONE' | 'GEODESIC' | 'RHUMB' | undefined,
        material: reactJson({ type: 'Color' } as CzmMaterialJsonType),
        stRotation: undefined as number | undefined,
        polygonHierarchy: reactJson({ positions: [] } as PolygonHierarchyType),//TODO
        height: undefined as number | undefined,
        extrudedHeight: undefined as number | undefined,
        ellipsoid: undefined as [x: number, y: number, z: number] | undefined,//TODO
        granularity: undefined as number | undefined,
        perPositionHeight: undefined as boolean | undefined,
        closeTop: undefined as boolean | undefined,
        closeBottom: undefined as boolean | undefined,
        editing: undefined as boolean | undefined,
        // textureCoordinates: reactJson({ positions: [] } as PolygonHierarchyType),//TODE
    });
}
extendClassProps(CzmPolygonPrimitiveWithHeight.prototype, CzmPolygonPrimitiveWithHeight.createDefaultProps);
export interface CzmPolygonPrimitiveWithHeight extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolygonPrimitiveWithHeight.createDefaultProps>> { }
