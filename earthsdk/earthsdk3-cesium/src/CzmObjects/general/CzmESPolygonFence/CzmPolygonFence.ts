import { PickedInfo } from "earthsdk3";
import { CzmCustomPrimitive, PointEditing, PositionsEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createGeoBoudingSphereReactFromPositions, positionsToLocalPositions } from "../../../utils";
import { Destroyable, Listener, Event, react, track, reactPositions, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";

export class CzmPolygonFence extends Destroyable {
    static defaults = {
        show: true,
        allowPicking: false,
        editing: false,
        pointEditing: false,
        positions: [] as [number, number, number][],
        height: 1000,
        // heightTextureRepeat: 1,
        textureSizeInMeters: [500, 500] as [number, number],
        textureUri: '${earthsdk3-assets-script-dir}/assets/img/location.png',
        textureMoveSpeed: [0, 0.3] as [number, number],
        textureColor: [1, 1, 1, 1] as [number, number, number, number],
    };

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _pointEditor;
    get pointEditor() { return this._pointEditor; }

    private _czmCustomPrimitive;
    get czmCustomPrimitive() { return this._czmCustomPrimitive; }

    // private _geoPolygon = this.disposeVar(new GeoPolygon());
    // get geoPolygon() { return this._geoPolygon; }

    private _geoBoundingSphere;
    get geoBoundingSphere() { return this._geoBoundingSphere.value; }
    get geoBoundingSphereChanged() { return this._geoBoundingSphere.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], true, [this, 'editing'], czmViewer));
        this._pointEditor = this.disposeVar(new PointEditing([this, 'positions'], [this, 'pointEditing'], czmViewer));
        this._czmCustomPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, id));
        this._geoBoundingSphere = this.disposeVar(createGeoBoudingSphereReactFromPositions([this, 'positions']));
        const { czmCustomPrimitive } = this;

        this.dispose(track([czmCustomPrimitive, 'show'], [this, 'show']));
        this.dispose(track([czmCustomPrimitive, 'allowPicking'], [this, 'allowPicking']));

        const totalDisReact = this.disposeVar(react(0));
        {
            const update = () => {
                if (!this.positions || this.positions.length < 3) {
                    czmCustomPrimitive.show = false;
                    return;
                }

                czmCustomPrimitive.show = true;

                const [localPositons, modelMatrix, inverseModelMatrix] = positionsToLocalPositions({ originPosition: this.positions[0] }, this.positions);
                czmCustomPrimitive.modelMatrix = modelMatrix;
                czmCustomPrimitive.cull = false;

                localPositons.push(localPositons[0]); // 闭环

                const l = localPositons.length;

                const ps = [...localPositons, ...localPositons.map(e => [e[0], e[1], e[2] + (this.height ?? CzmPolygonFence.defaults.height)] as [number, number, number])];

                const distances = localPositons.reduce<number[]>((p, c, ci, a) => {
                    if (ci === 0) {
                        p.push(0);
                        return p;
                    }

                    const pi = ci - 1;
                    const pc = a[pi];
                    const d = Math.sqrt((pc[0] - c[0]) * (pc[0] - c[0]) + (pc[1] - c[1]) * (pc[1] - c[1]));
                    p.push(p[pi] + d);
                    return p;
                }, []);
                // const totalDis = distances.reduce<number>((a, c) => c + a, 0);
                totalDisReact.value = distances[l - 1];

                const st = distances.map(e => e / totalDisReact.value);
                const sts = [...st.map(e => [e, 0]), ...st.map(e => [e, 1])];

                czmCustomPrimitive.attributes = {
                    a_position: {
                        typedArray: new Float32Array(ps.flat(1)),
                        componentsPerAttribute: 3,
                    },
                    a_st: {
                        typedArray: new Float32Array(sts.flat(1)),
                        componentsPerAttribute: 2,
                    }
                };

                const bb = czmCustomPrimitive.computeLocalAxisedBoundingBoxFromAttribute('a_position');
                if (!bb) {
                    console.warn(`包围盒计算存在问题！`);
                    return;
                }
                czmCustomPrimitive.setLocalAxisedBoundingBox(bb.min, bb.max);

                const index = [...new Array(l - 1).keys()].map(e => [
                    [e, e + 1, e + l + 1],
                    [e, e + l + 1, e + l],
                    [e + l + 1, e + 1, e], // 背面裁剪管不了，只能再绘制一次了！
                    [e + l, e + l + 1, e],
                ]).flat(2) as number[];
                czmCustomPrimitive.indexTypedArray = new Uint16Array(index);
                //此处注释，原因：修改positions时会覆盖已经设置的uniformMap
                // czmCustomPrimitive.uniformMap = {
                //     u_image: {
                //         "type": "image",
                //         "uri": "${xe2-assets-script-dir}/xe2-assets/scene-manager/images/location.png"
                //     },
                //     u_stScale: [1, 1],
                //     u_speed: [0, 0.3],
                //     u_color: [1, 1, 0, 1]
                // };

                czmCustomPrimitive.vertexShaderSource = `\
                    in vec3 a_position;
                    in vec2 a_st;
                    out vec2 v_st;
                    void main()
                    {
                        v_st = a_st;
                        gl_Position = czm_modelViewProjection * vec4(a_position, 1.0);
                    }
                `;

                czmCustomPrimitive.fragmentShaderSource = `\
                    in vec2 v_st;
                    uniform sampler2D u_image;
                    uniform vec4 u_color;
                    uniform vec2 u_speed;
                    uniform vec2 u_stScale;
                    void main()
                    {
                        vec2 addst = u_speed * (czm_frameNumber / 60.0);
                        vec4 imageColor = texture(u_image, fract(v_st * u_stScale - addst));
                        out_FragColor = imageColor * u_color;
                    }
                `;
            }
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this.heightChanged,
                this.positionsChanged,
            ));
            this.dispose(event.disposableOn(update));
        }

        {
            this.dispose(this.flyToEvent.disposableOn(duration => {
                this.czmCustomPrimitive.flyTo(duration);
            }));
        }

        {
            const update = () => {
                const toalDistance = !!totalDisReact.value ? totalDisReact.value : 1;
                const height = this.height ?? CzmPolygonFence.defaults.height;
                const { textureSizeInMeters = CzmPolygonFence.defaults.textureSizeInMeters } = this;
                const { textureUri = CzmPolygonFence.defaults.textureUri } = this;

                czmCustomPrimitive.uniformMap = {
                    u_image: {
                        type: "image",
                        uri: textureUri,
                    },
                    u_stScale: [
                        toalDistance / textureSizeInMeters[0],
                        height / textureSizeInMeters[1],
                    ],
                    u_speed: this.textureMoveSpeed ?? CzmPolygonFence.defaults.textureMoveSpeed,
                    u_color: this.textureColor ?? CzmPolygonFence.defaults.textureColor,
                };
            };
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this.textureColorChanged,
                this.textureMoveSpeedChanged,
                this.textureSizeInMetersChanged,
                this.heightChanged,
                this.textureSizeInMetersChanged,
                this.textureUriChanged,
                totalDisReact.changed,
            ))
            this.dispose(event.disposableOn(update));
        }
    }
}

export namespace CzmPolygonFence {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        allowPicking: undefined as boolean | undefined,
        editing: undefined as boolean | undefined,
        pointEditing: undefined as boolean | undefined,
        positions: reactPositions(undefined),
        height: undefined as number | undefined,
        // heightTextureRepeat: undefined as number | undefined,
        textureSizeInMeters: reactArrayWithUndefined<[number, number] | undefined>(undefined),
        textureUri: undefined as string | undefined,
        textureMoveSpeed: reactArrayWithUndefined<[number, number] | undefined>(undefined),
        textureColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
    });
}
extendClassProps(CzmPolygonFence.prototype, CzmPolygonFence.createDefaultProps);
export interface CzmPolygonFence extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolygonFence.createDefaultProps>> { }
