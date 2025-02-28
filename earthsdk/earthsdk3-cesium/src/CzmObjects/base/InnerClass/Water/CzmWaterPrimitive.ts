import { ESCesiumViewer, getViewerExtensions } from "../../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, debounce, Destroyable, Event, extendClassProps, reactPositions, SceneObjectKey, UniteChanged } from "xbsj-base";
import * as Cesium from 'cesium';
import { ESGeoWater, ESJColor, ESSceneObject } from "earthsdk3";
import { createPolygonHierarchy, flyTo, positionFromCartesian, positionsToUniqueCartesians, toColor, toEllipsoid } from "../../../../utils";
import { PolygonHierarchyType } from "../../../../ESJTypesCzm";

export class CzmWaterPrimitive extends Destroyable {
    private _primitive?: Cesium.Primitive | Cesium.GroundPrimitive;

    private _flyToEvent = this.dv(new Event<[duration: number]>());
    get flyToEvent() { return this._flyToEvent; }
    flyTo(duration: number) { this._flyToEvent.emit(duration); }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super()
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const extensions = getViewerExtensions(czmViewer.viewer);
        if (!extensions) return;
        const normalMap = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/water/waterNormalsSmall.jpg');

        const removePrimitive = () => {
            if (!this._primitive) return;
            viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
        };
        this.d(removePrimitive);

        const createWaterMaterial = () => {
            const uniforms: any = {
                baseWaterColor: toColor(this.waterColor),
                normalMap,
                frequency: this.frequency,
                animationSpeed: this.waveVelocity,
                amplitude: this.amplitude,
                specularIntensity: this.specularIntensity,
            }
            const material = new Cesium.Material({ fabric: { type: 'Water', uniforms } })
            return material;
        }

        const getPolygonInstance = () => {
            if (!this.points) return undefined
            const hierarchy = { positions: this.points } as PolygonHierarchyType;
            const geometry = new Cesium.PolygonGeometry({
                polygonHierarchy: createPolygonHierarchy(hierarchy),
                vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
                height: this.height
            })
            const polygonInstance = new Cesium.GeometryInstance({ geometry, id: this })
            return polygonInstance
        }

        const createPrimitive = () => {
            if (!this.points) return undefined
            const appearance = new Cesium.EllipsoidSurfaceAppearance({
                material: createWaterMaterial(),
                aboveGround: true,
            });
            const polygonInstance = getPolygonInstance();
            let primitive: Cesium.Primitive | Cesium.GroundPrimitive;
            if (this.ground ?? false) {
                primitive = new Cesium.GroundPrimitive({
                    geometryInstances: polygonInstance,
                    appearance,
                    asynchronous: false,
                    allowPicking: this.allowPicking,
                    compressVertices: false,
                });
            } else {
                primitive = new Cesium.Primitive({
                    geometryInstances: polygonInstance,
                    appearance,
                    asynchronous: false,
                    allowPicking: this.allowPicking,
                    compressVertices: false,
                });
            }
            //@ts-ignore
            Cesium.Primitive.prototype && Cesium.GroundPrimitive.prototype && (primitive.ESSceneObjectID = id);
            return primitive;
        }

        const boundingSphere = new Cesium.BoundingSphere();
        const recreatePolygon = () => {
            removePrimitive()
            updateBoundingSphere(boundingSphere);
            this._primitive = createPrimitive();
            this._primitive && viewer.scene.primitives.add(this._primitive);
        }

        const updateBoundingSphere = (boundingSphere: Cesium.BoundingSphere) => {
            if (!this.points) return;
            const cartesians = positionsToUniqueCartesians(this.points);
            if (cartesians.length < 3) {
                boundingSphere.radius = -1;
                return;
            }
            Cesium.BoundingSphere.fromPoints(cartesians, boundingSphere);
        }
        const updatePolygon = () => {
            const polygonShow = this.show ?? true;
            this._primitive && (this._primitive.show = polygonShow);
        };
        const reset = () => {
            recreatePolygon();
            updatePolygon();
        }
        reset();
        let resetFromDebounce = debounce(reset, 500);

        const recreateEvent = this.dv(createNextAnimateFrameEvent(
            this.waterColorChanged,
            this.frequencyChanged,
            this.amplitudeChanged,
            this.specularIntensityChanged,
            this.waveVelocityChanged,

            this.groundChanged,
            this.allowPickingChanged,
        ));

        this.d(recreateEvent.don(reset));

        const updateEvent = this.dv(createNextAnimateFrameEvent(
            this.pointsChanged,
            this.heightChanged,
        ));
        this.d(updateEvent.don(() => {
            if (!this.points) {
                removePrimitive();
                return;
            }
            if (this._primitive && !this.ground) {
                //@ts-ignore
                this._primitive._state = 3; // 关键
                //@ts-ignore
                this._primitive._appearance = undefined; // 关键
                //@ts-ignore
                this._primitive.geometryInstances = getPolygonInstance();
                updateBoundingSphere(boundingSphere);
                // 防抖，最后一次更新包围盒
                resetFromDebounce && resetFromDebounce[0]();
            } else {
                reset();
            }
        }));
        this.d(this.showChanged.don(updatePolygon));

        this.d(this.flyToEvent.don(duration => {
            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmWaterPrimitive {
    export const createDefaultProps = () => ({
        show: true,
        points: reactPositions(undefined),
        height: undefined as number | undefined,
        allowPicking: true,
        ground: false,

        waterColor: [0.1497, 0.165, 0.0031, 1] as ESJColor,
        frequency: 1000,
        waveVelocity: 0.5,
        amplitude: 0.1,
        specularIntensity: 0.8
    });
}
extendClassProps(CzmWaterPrimitive.prototype, CzmWaterPrimitive.createDefaultProps);
export interface CzmWaterPrimitive extends UniteChanged<ReturnType<typeof CzmWaterPrimitive.createDefaultProps>> { }
