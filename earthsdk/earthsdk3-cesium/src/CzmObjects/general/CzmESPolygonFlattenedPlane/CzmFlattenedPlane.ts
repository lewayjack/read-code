import { Destroyable, Listener, Event, react, extendClassProps, ReactivePropsToNativePropsAndChanged, reactArray, reactArrayWithUndefined, track, ObjResettingWithEvent, createNextAnimateFrameEvent, SceneObjectWithId, createGuid, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Czm3DTiles, Czm3DTilesCustomShaderInstanceClassType } from "../CzmES3DTileset";
import { ESJNativeNumber16, ESSceneObjectWithId } from "earthsdk3";
import { computeCzmModelMatrix, flyTo } from "../../../utils";
import { CzmPolylinesPrimitive, PositionEditing } from "../../../CzmObjects";

function createFlattenedCustomShaderInstance(reverse: boolean, czmFlattenedPlane: CzmFlattenedPlane) {
    return class FlattenedInstance extends Destroyable {
        get sceneObject() { return this._sceneObject; }
        get viewer() { return this._viewer; }

        // @ts-ignore
        private _customShader = this.disposeVar(new Cesium.CustomShader({
            // lightingModel: Cesium.LightingModel.UNLIT,
            uniforms: {
                u_discardRatio: {
                    value: new Cesium.Cartesian2(0.0, 1.0),
                    type: Cesium.UniformType.VEC2,
                },
                u_topColor: {
                    value: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
                    type: Cesium.UniformType.VEC4,
                },
                u_bottomColor: {
                    value: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
                    type: Cesium.UniformType.VEC4,
                },
            },
            varyings: {
                v_xbsjPos: Cesium.VaryingType.VEC3,
                v_m: Cesium.VaryingType.FLOAT,
            },
            vertexShaderText: `\
                // IMPORTANT: the function signature must use these parameter names. This
                // makes it easier for the runtime to generate the shader and make optimizations.
                void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
                    // code goes here. An empty body is a no-op.
                    #ifdef XBSJ_FLATTERN
                    vec3 xbsjPos = (u_inverseElevationModelMatrix * vec4(vsInput.attributes.positionMC, 1.0)).xyz;
                    vec2 size = u_flattenedBound.zw - u_flattenedBound.xy;
                    vec2 st = (xbsjPos.xy - u_flattenedBound.xy) / size;
                    ${!reverse ? `\
                        v_m = 0.0;
                        if (all(greaterThan(st, vec2(0, 0))) && all(lessThan(st, vec2(1.0)))) {
                            vec4 color = texture(u_flattenedPolygonTexture, st);
                            v_m = clamp(max(color.r, max(color.g, color.b)) * color.a, 0., 1.);
                            xbsjPos.z = mix(xbsjPos.z, (atan(xbsjPos.z) / 3.1415926), v_m);
                            vsOutput.positionMC = (u_inverseModelElevationMatrix * vec4(xbsjPos, 1.0)).xyz;
                        }
                        ` : `\
                        v_m = 1.;
                        if ( all(greaterThan(st, vec2(0, 0))) && all(lessThan(st, vec2(1.0))) ) {
                            vec4 color = texture(u_flattenedPolygonTexture, st);
                            v_m = 1. - clamp(max(color.r, max(color.g, color.b)) * color.a, 0., 1.);
                            xbsjPos.z = mix(xbsjPos.z, (atan(xbsjPos.z) / 3.1415926), v_m);
                        } else {
                            xbsjPos.z = (atan(xbsjPos.z) / 3.1415926);
                        }
                        vsOutput.positionMC = (u_inverseModelElevationMatrix * vec4(xbsjPos, 1.0)).xyz;
                    `}
                    v_xbsjPos = xbsjPos;
                    #endif
                }
              `,
            fragmentShaderText: `\
                // Color tiles by distance to the camera
                void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
                {
                    if (v_m < u_discardRatio.x) discard;
                    if (v_m > u_discardRatio.y) discard;

                    if (v_xbsjPos.z <= 0.) {
                        material.diffuse *= (u_bottomColor.rgb * u_bottomColor.a);
                    } else {
                        material.diffuse *= (u_topColor.rgb * u_topColor.a);
                    }
                }
              `,
        }));

        get customShader() { return this._customShader; }

        constructor(private _sceneObject: Czm3DTiles, private _viewer: ESCesiumViewer) {
            super();

            {
                const update = () => {
                    // @ts-ignore
                    this._customShader.uniforms.u_discardRatio.value = Cesium.Cartesian2.fromArray(czmFlattenedPlane.discard);
                };
                update();
                this.dispose(czmFlattenedPlane.discardChanged.disposableOn(update));
            }

            {
                const update = () => {
                    // @ts-ignore
                    this._customShader.uniforms.u_bottomColor.value = new Cesium.Color(...czmFlattenedPlane.bottomColor);
                };
                update();
                this.dispose(czmFlattenedPlane.bottomColorChanged.disposableOn(update));
            }

            {
                const update = () => {
                    // @ts-ignore
                    this._customShader.uniforms.u_topColor.value = new Cesium.Color(...czmFlattenedPlane.topColor);
                };
                update();
                this.dispose(czmFlattenedPlane.topColorChanged.disposableOn(update));
            }
        }

        update() {
            alert('暂未实现!');
        }
    }
}

function computeSkeleton(
    minSize: [number, number],
    maxSize: [number, number],
    finalMatrix: Cesium.Matrix4
) {
    const l = minSize;
    const b = maxSize;

    // lineSkeleton;
    const lp: [number, number, number][] = [
        [l[0], l[1], 0],
        [b[0], l[1], 0],
        [b[0], b[1], 0],
        [l[0], b[1], 0],
    ];
    const td = Cesium.Math.toDegrees;
    const wp: [number, number, number][] = lp.map(e => {
        const cartesian = Cesium.Matrix4.multiplyByPoint(finalMatrix, Cesium.Cartesian3.fromElements(...e), new Cesium.Cartesian3());
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        return [td(carto.longitude), td(carto.latitude), carto.height];
    });
    const polylinesPositions: [number, number, number][][] = [
        [wp[0], wp[1], wp[2], wp[3], wp[0]],
    ];
    return polylinesPositions;
}

class CustomShaderResetting extends Destroyable {
    private _customShader;
    get customShader() { return this._customShader; }
    constructor(
        private _czmFlattenedPlane: CzmFlattenedPlane,
        private _reverse: boolean,
    ) {
        super();
        this._customShader = createFlattenedCustomShaderInstance(this._reverse, this._czmFlattenedPlane);
        // @ts-ignore
        this._czmFlattenedPlane.computedCustomShader = this.customShader;
        this.dispose(() => {
            this._czmFlattenedPlane.computedCustomShader = undefined;
        });
    }
}

export class CzmFlattenedPlane extends Destroyable {
    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        position: [116.39, 39.9, 100] as [number, number, number],
    };

    private _computedCustomShader = this.disposeVar(react<Czm3DTilesCustomShaderInstanceClassType | undefined>(undefined));
    get computedCustomShader() { return this._computedCustomShader.value; }
    set computedCustomShader(value: Czm3DTilesCustomShaderInstanceClassType | undefined) { this._computedCustomShader.value = value; }
    get computedCustomShaderChanged() { return this._computedCustomShader.changed; }

    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    private _polylines;
    get polylines() { return this._polylines; }

    private _finalMatrix = this.disposeVar(react<Cesium.Matrix4 | undefined>(undefined));
    get finalMatrix() { return this._finalMatrix.value; }
    set finalMatrix(value: Cesium.Matrix4 | undefined) { this._finalMatrix.value = value; }
    get finalMatrixChanged() { return this._finalMatrix.changed; }

    private _czmTextureWithId;
    get czmTextureWithId() { return this._czmTextureWithId; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        this._czmTextureWithId = this.disposeVar(new ESSceneObjectWithId());
        this._sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'positionEditing'], czmViewer));
        this._polylines = this.disposeVar(new CzmPolylinesPrimitive(czmViewer));
        this._polylines.arcType = 'NONE';
        this.dispose(track([this._czmTextureWithId, 'id'], [this, 'czmTextureId']));
        // this.registerAttachedObjectForContainer((viewer) => {
        // const disposer = new Destroyable();
        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!(czmViewer instanceof ESCesiumViewer)) return;
            if (!czmViewer.actived) return;
            if (!this.position) {
                console.warn(`CzmFlattenedPlane warning: 没有位置，无法飞入！`);
                return;
            }
            const l = this.minSize;
            const b = this.maxSize;
            const s = [b[0] - l[0], b[1] - l[1]] as [number, number];
            const d = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
            flyTo(czmViewer.viewer, this.position, d * 2, undefined, duration);
        }));
        // return disposer;
        // });

        {
            const update = () => {
                if (!this.enabled) {
                    this.finalMatrix = undefined;
                    this.polylines.positions = undefined;
                    return;
                }

                const matrixArray = [...this.modelMatrix] as ESJNativeNumber16;
                let polylinesPositions: [number, number, number][][] = [];
                do {
                    this.finalMatrix = undefined;
                    if (!this.position) break;

                    const posRotMatrix = computeCzmModelMatrix({
                        position: this.position,
                        rotation: this.rotation,
                    });
                    if (!posRotMatrix) break;

                    const nativeMatrix = Cesium.Matrix4.fromArray(this.modelMatrix);
                    const finalMatrix = Cesium.Matrix4.multiply(posRotMatrix, nativeMatrix, new Cesium.Matrix4());
                    Cesium.Matrix4.toArray(finalMatrix, matrixArray);
                    this.finalMatrix = finalMatrix;

                    polylinesPositions = computeSkeleton(this.minSize, this.maxSize, finalMatrix);
                } while (false);
                this.polylines.positions = polylinesPositions;
            }
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this.enabledChanged,
                this.positionChanged,
                this.rotationChanged,
                this.modelMatrixChanged,
                this.minSizeChanged,
                this.maxSizeChanged,
            ));
            this.dispose(event.disposableOn(update));
        }

        {
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this.enabledChanged,
                this.reverseChanged,
                // this.discardChanged,
            ));
            this.disposeVar(new ObjResettingWithEvent(event, () => {
                if (!this.enabled) return undefined;
                return new CustomShaderResetting(this, this.reverse);
            }));
        }

        {
            this.dispose(track([this.polylines, 'color'], [this, 'edgeColor']));
            this.dispose(track([this.polylines, 'width'], [this, 'edgeWidth']));
            this.dispose(track([this.polylines, 'show'], [this, 'showHelper']));
        }
    }
}

export namespace CzmFlattenedPlane {
    export const createDefaultProps = () => ({
        enabled: true,
        showHelper: true,
        positionEditing: false,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单
        rotation: reactArray<[number, number, number]>([0, 0, 0]), // 偏航俯仰翻转，度为单位
        modelMatrix: reactArray<ESJNativeNumber16>([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        reverse: false,
        discard: reactArray<[number, number]>([0.0, 1.0]),
        topColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        bottomColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        edgeColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        edgeWidth: 2,
        minSize: reactArray<[number, number]>([-100, -100]),
        maxSize: reactArray<[number, number]>([100, 100]),
        /**
         * @deprecated 该属性已弃用，请使用Czm3dTiles的czmFlattenedPlaneId属性！
        */
        sceneObjectIds: reactArray<string[]>([]),
        czmTextureId: '',
    });
}
extendClassProps(CzmFlattenedPlane.prototype, CzmFlattenedPlane.createDefaultProps);
export interface CzmFlattenedPlane extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmFlattenedPlane.createDefaultProps>> { }
