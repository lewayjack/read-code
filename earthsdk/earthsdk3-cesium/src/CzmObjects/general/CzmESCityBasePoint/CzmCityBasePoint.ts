import { PickedInfo } from "earthsdk3";
import { CzmCustomPrimitive } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { extendComponentProps, getDefaultComponentProps, setCylinderGeometry, setRectangleGeometry } from "../../../utils";
import { Destroyable, Listener, Event, track, bind, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";

const defaultRenderState = {
    depthTest: {
        enabled: true,
    },
    cull: {
        enabled: true,
        face: 1029, // FRONT: 1028; BACK: 1029; FRONT_AND_BACK: 1032
    },
    // depthMask: false,
    blending: {
        enabled: true,
        equationRgb: 0x8006, // ADD: 0x8006; 
        equationAlpha: 0x8006, // ADD: 0x8006; 
        functionSourceRgb: 0x0302, // SRC_ALPHA: 0x0302
        functionSourceAlpha: 1, // ONE: 1
        functionDestinationRgb: 0x0303, // ONE_MINUS_SRC_ALPHA
        functionDestinationAlpha: 0x0303, // ONE_MINUS_SRC_ALPHA
    }
};

export class CzmCityBasePoint extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _circleCustomPrimitive;
    get circleCustomPrimitive() { return this._circleCustomPrimitive; }

    private _cylinderCustomPrimitive;
    get cylinderCustomPrimitive() { return this._cylinderCustomPrimitive; }

    private _cylinderParticlesCustomPrimitive;
    get cylinderParticlesCustomPrimitive() { return this._cylinderParticlesCustomPrimitive; }

    static defaultParticlesImageUri = '${earthsdk3-assets-script-dir}/assets/img/particles.png'

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._circleCustomPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, id));
        this._cylinderCustomPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, id));
        this._cylinderParticlesCustomPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, id));

        const { circleCustomPrimitive } = this;

        {
            setRectangleGeometry(circleCustomPrimitive, {
                width: 120,
                height: 120,
            });
            // circleCustomPrimitive.uniformMap = {
            //     u_color: [1, 1, 0, 2],
            // };
            circleCustomPrimitive.fragmentShaderSource = `
                in vec2 v_st;
                uniform vec4 u_color;
                void main()
                {
                    float d = length(v_st);
                    float movingCircleD = fract(czm_frameNumber / 130.0);
                    float alpha = step(d, .1) + step(.4, d) * step(d, .45) + step(.9, d) * step(d, 1.) + d * d * step(d, 1.);
                    alpha += step(movingCircleD, d) * step(d, movingCircleD + .01);
                    out_FragColor = vec4(u_color.rgb, alpha);
                }
            `;

            circleCustomPrimitive.pass = 'TRANSLUCENT';
            circleCustomPrimitive.renderState = defaultRenderState;
            circleCustomPrimitive.allowPickingDepth = false;
        }

        const { cylinderCustomPrimitive } = this;
        {
            setCylinderGeometry(cylinderCustomPrimitive, {
                segments: 36,
                startRadius: 10,
                stopRadius: 2,
                height: 260,
            });
            // cylinderCustomPrimitive.uniformMap = {
            //     u_color: [1, 1, 0, 2],
            // };
            cylinderCustomPrimitive.fragmentShaderSource = `
                in vec2 v_st;
                uniform vec4 u_color;
                void main()
                {
                    float powerRatio = fract(czm_frameNumber / 30.0) + 1.0;
                    float alpha = pow(1.0 - v_st.t, powerRatio);
                    out_FragColor = vec4(u_color.rgb, alpha*u_color.a);
                }
            `;

            cylinderCustomPrimitive.pass = 'TRANSLUCENT';
            cylinderCustomPrimitive.renderState = defaultRenderState;
            cylinderCustomPrimitive.allowPickingDepth = false;
        }

        const { cylinderParticlesCustomPrimitive } = this;
        {
            setCylinderGeometry(cylinderParticlesCustomPrimitive, {
                segments: 36,
                startRadius: 20,
                stopRadius: 4,
                height: 230,
            });
            cylinderParticlesCustomPrimitive.uniformMap = {
                u_color: [1, 1, 0, 2],
                u_image: { type: 'image', uri: CzmCityBasePoint.defaultParticlesImageUri }
            };
            cylinderParticlesCustomPrimitive.fragmentShaderSource = `
                in vec2 v_st;
                uniform sampler2D u_image;
                uniform vec4 u_color;
                void main()
                {
                    float dt = fract(czm_frameNumber / 90.0);
                    vec2 st = fract(vec2(1.0) + v_st - vec2(dt, dt));
                    vec4 imageColor = texture(u_image, st);
                    out_FragColor = imageColor * u_color;
                    out_FragColor.a *= smoothstep(1., 0.8, v_st.t);
                }
            `;

            cylinderParticlesCustomPrimitive.pass = 'TRANSLUCENT';
            cylinderParticlesCustomPrimitive.renderState = defaultRenderState;
            cylinderParticlesCustomPrimitive.allowPickingDepth = false;
        }

        {
            this.dispose(track([circleCustomPrimitive, 'show'], [this, 'show']));
            this.dispose(track([cylinderCustomPrimitive, 'show'], [this, 'show']));
            this.dispose(track([cylinderParticlesCustomPrimitive, 'show'], [this, 'show']));
        }

        {
            this.dispose(track([circleCustomPrimitive, 'position'], [this, 'position']));
            this.dispose(track([cylinderCustomPrimitive, 'position'], [this, 'position']));
            this.dispose(track([cylinderParticlesCustomPrimitive, 'position'], [this, 'position']));
            // const positionEditing = this.disposeVar(createPositionEditingRefForComponent([this, 'position'], this.components));
            // this.dispose(bind(positionEditing, [this, 'positionEditing']));
        }

        {
            this.dispose(track([circleCustomPrimitive, 'scale'], [this, 'scale']));
            this.dispose(track([cylinderCustomPrimitive, 'scale'], [this, 'scale']));
            this.dispose(track([cylinderParticlesCustomPrimitive, 'scale'], [this, 'scale']));
        }

        {
            const u_image: { type: 'image', uri: string } = { type: 'image', uri: CzmCityBasePoint.defaultParticlesImageUri };
            const update = () => {
                circleCustomPrimitive.uniformMap = { u_color: this.color ?? [1, 1, 0, 2], };
                cylinderCustomPrimitive.uniformMap = { u_color: this.color ?? [1, 1, 0, 2], };
                cylinderParticlesCustomPrimitive.uniformMap = { u_color: this.color ?? [1, 1, 0, 2], u_image, };
            };
            update();
            this.dispose(this.colorChanged.disposableOn(update));
        }

        {
            this.dispose(this.flyToEvent.disposableOn(duration => {
                cylinderCustomPrimitive.flyTo(duration);
            }));
        }
        {
            this.dispose(track([circleCustomPrimitive, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(track([cylinderCustomPrimitive, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(track([cylinderParticlesCustomPrimitive, 'allowPicking'], [this, 'allowPicking']));
        }
    }
}

export namespace CzmCityBasePoint {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        positionEditing: undefined as boolean | undefined,
        scale: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        color: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        allowPicking: undefined as boolean | undefined,
    });
}
extendClassProps(CzmCityBasePoint.prototype, CzmCityBasePoint.createDefaultProps);
export interface CzmCityBasePoint extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmCityBasePoint.createDefaultProps>> { }
