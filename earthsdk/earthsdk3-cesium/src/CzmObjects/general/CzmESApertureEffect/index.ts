import { ESApertureEffect } from "earthsdk3";
import { CzmCustomPrimitive, CzmESObjectWithLocation } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, flyWithPrimitive } from "../../../utils";
import { bind, track } from "xbsj-base";

export class CzmESApertureEffect extends CzmESObjectWithLocation<ESApertureEffect> {
    static readonly type = this.register("ESCesiumViewer", ESApertureEffect.type, this);
    private _czmCustomPrimitive
    get czmCustomPrimitive() { return this._czmCustomPrimitive };

    constructor(sceneObject: ESApertureEffect, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmCustomPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, this.sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const { czmCustomPrimitive } = this;
        this.dispose(track([czmCustomPrimitive, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bindNorthRotation([czmCustomPrimitive, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(bind([czmCustomPrimitive, 'position'], [sceneObject, 'position']));
        this.dispose(track([czmCustomPrimitive, 'scale'], [sceneObject, 'scale']));


        czmCustomPrimitive.indexTypedArray = new Uint16Array([0, 1, 2, 0, 2, 3]);
        czmCustomPrimitive.uniformMap = {
            u_color: [0, 0.7, 1, 1],
        };
        czmCustomPrimitive.fragmentShaderSource = `
                in vec2 v_st;
                uniform vec4 u_color;
                void main()
                {
                    float d = length(v_st);
                    float movingCircleD = fract(czm_frameNumber / 130.0);
                    float alpha = step(.3, d) * step(d, .35) + step(.98, d) * step(d, 1.) + d * d * step(d, 1.);
                    alpha += step(movingCircleD, d) * step(d, movingCircleD + .015);
                    out_FragColor = vec4(u_color.rgb, alpha);
                }
            `;


        const update = () => {
            const width = sceneObject.radius * 2
            const height = sceneObject.radius * 2

            czmCustomPrimitive.boundingVolume = {
                type: 'LocalAxisedBoundingBox',
                data: {
                    min: [-width * .5, -height * .5, 0],
                    max: [width * .5, height * .5, 0],
                }
            };

            czmCustomPrimitive.attributes = {
                position: {
                    componentsPerAttribute: 3,
                    typedArray: new Float32Array([
                        -0.5 * width, -0.5 * height, 0,
                        0.5 * width, -0.5 * height, 0,
                        0.5 * width, 0.5 * height, 0,
                        -0.5 * width, 0.5 * height, 0,
                    ]),
                },
                normal: {
                    componentsPerAttribute: 3,
                    typedArray: new Float32Array([
                        0, 0, 1,
                        0, 0, 1,
                        0, 0, 1,
                        0, 0, 1,
                    ]),
                },
                textureCoordinates: {
                    componentsPerAttribute: 2,
                    typedArray: new Float32Array([
                        -1, -1,
                        1, -1,
                        1, 1,
                        -1, 1,
                    ]),
                },
            };
        }
        update()
        this.dispose(sceneObject.radiusChanged.don(() => update()));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmCustomPrimitive } = this;
        if (!czmViewer.actived || !czmViewer.viewer) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            super.flyTo(duration, id);
            return true;
        } else {
            flyWithPrimitive(czmViewer, sceneObject, id, duration, czmCustomPrimitive, true);
            return true;
        }
    }
}
