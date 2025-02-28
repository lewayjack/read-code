import { ESDataMesh, ESSceneObject, getMinMaxCorner } from "earthsdk3";
import { CzmCustomPrimitive, CzmESObjectWithLocation, CzmTexture } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, flyWithPrimitive } from "../../../utils";
import { bind, ColorStops, createNextAnimateFrameEvent, createProcessingFromAsyncFunc, fetchArrayBuffer, react, sleep, track } from "xbsj-base";

export type CzmESDataMeshBuffers = {
    indexBuffer: Uint16Array;
    vertexBuffer: Float32Array;
    propBuffers: Float32Array[];
};

async function getBuffers(basePath: string, num: number) {
    const indexBufferPromise = fetchArrayBuffer(basePath + 'index.bin');
    const vertexBufferPromise = fetchArrayBuffer(basePath + 'vertex.bin');
    const ps = [...new Array(num).keys()].map(
        n => n.toString().padStart(6, '0')
    ).map(
        n => `${basePath}bins/R2DC${n}.bin`
    ).map(
        path => fetchArrayBuffer(path)
    );
    const dataResult = await Promise.all([indexBufferPromise, vertexBufferPromise, ...ps]);
    if (dataResult.some(e => e === undefined)) {
        console.warn(`有数据未能解析！`);
        return undefined;
    }
    const [indexBufferResult, ...otherBufferResult] = dataResult as ArrayBuffer[];

    const indexBuffer = new Uint16Array(indexBufferResult);
    const [vertexBuffer, ...propBuffers] = otherBufferResult.map(e => new Float32Array(e));

    return { indexBuffer, vertexBuffer, propBuffers } as CzmESDataMeshBuffers;
}

function* getNumber3Iterator(buffer: Float32Array) {
    const l = buffer.length;
    const n = l / 3 | 0;
    for (let i = 0; i < n; ++i) {
        yield [buffer[i * 3 + 0], buffer[i * 3 + 1], buffer[i * 3 + 2]] as [number, number, number];
    }
}

export class CzmESDataMesh extends CzmESObjectWithLocation<ESDataMesh> {
    static readonly type = this.register('ESCesiumViewer', ESDataMesh.type, this);

    private _czmCustomPrimitive
    get czmCustomPrimitive() { return this._czmCustomPrimitive; }

    // SceneObject.createFromClass 创建的对象才能根据id来找到对象！
    private _czmTexture;
    get czmTexture() { return this._czmTexture; }

    constructor(sceneObject: ESDataMesh, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmCustomPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, sceneObject.id));
        this._czmTexture = this.ad(new CzmTexture(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const { czmCustomPrimitive } = this;

        const { czmTexture } = this;

        {
            czmTexture.uri = '';
            czmTexture.size = [1024, 1];
            czmTexture.enabled = true;

            const cs = new ColorStops();

            const update = () => {
                cs.value = sceneObject.colorStops ?? ESDataMesh.defaults.colorStops;
                const imageBuffer = cs.getColorsInUint8(new Uint8Array(1024 * 4));
                czmTexture.copyTexture({
                    source: {
                        width: 1024,
                        height: 1,
                        arrayBufferView: imageBuffer
                    }
                });
            };
            update();
            this.dispose(sceneObject.colorStopsChanged.disposableOn(update));
        }

        {
            this.dispose(track([czmCustomPrimitive, 'show'], [sceneObject, 'show']));
            this.dispose(track([czmCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.dispose(bind([czmCustomPrimitive, 'position'], [sceneObject, 'position']));
            this.dispose(bindNorthRotation([czmCustomPrimitive, 'rotation'], [sceneObject, 'rotation']));
        }

        {
            czmCustomPrimitive.cull = false;
            czmCustomPrimitive.vertexShaderSource = `
                precision highp float;
                in vec3 a_position;
                in vec3 a_prop;
                in vec3 a_prop2;
                out vec3 v_prop;
                out vec3 v_prop2;
                void main(void) {
                    mat4 u_modelViewMatrix = czm_modelView;
                    mat4 u_projectionMatrix = czm_projection;
                    vec4 pos = u_modelViewMatrix * vec4(a_position, 1.0);
                    v_prop = a_prop;
                    v_prop2 = a_prop2;
                    gl_Position = u_projectionMatrix * pos;
                }
            `;

            czmCustomPrimitive.fragmentShaderSource = `
                precision highp float;
                in vec3 v_prop;
                in vec3 v_prop2;
                uniform sampler2D u_gradientMap;
                uniform vec2 u_stripMinMaxValue;
                uniform float u_ratio;

                void main() {
                    float prop = v_prop.y * (1.0 - u_ratio) + v_prop2.y * u_ratio;
                    float a = (prop - u_stripMinMaxValue[0]) / (u_stripMinMaxValue[1] - u_stripMinMaxValue[0]);
                    if (a <= 0.) discard;
                    // out_FragColor = vec4(texture(u_gradientMap, vec2(a, .5)).rgb, (a + .1)*4.);
                    out_FragColor = vec4(texture(u_gradientMap, vec2(a, .5)).rgb, a);
                }
            `;
            czmCustomPrimitive.uniformMap = {
                "u_gradientMap": {
                    "type": "texture",
                    "id": "5d45a4a4-4f5d-4424-aea5-181de75bd13b"
                },
                "u_stripMinMaxValue": [
                    0,
                    1
                ],
                "u_ratio": 0,
            };
        }

        let buffers = this.disposeVar(react<CzmESDataMeshBuffers | undefined>(undefined));

        {
            const getBuffersProcessing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
                buffers.value = undefined;
                const url = sceneObject.url ?? ESDataMesh.defaults.url;
                if (!url) return;
                await cancelsManager.promise(sleep(200));
                const maxNum = (sceneObject.maxTime ?? ESDataMesh.defaults.maxTime) | 0;
                buffers.value = await cancelsManager.promise(getBuffers(ESSceneObject.context.getStrFromEnv(typeof url == 'string' ? url : url.url), maxNum + 1));
            }));

            getBuffersProcessing.start();
            const event = this.disposeVar(createNextAnimateFrameEvent(sceneObject.urlChanged, sceneObject.maxTimeChanged));
            this.dispose(event.disposableOn(() => getBuffersProcessing.restart()));
        }

        {
            class Number3sIterable {
                constructor(private _buffer: Float32Array) { }
                [Symbol.iterator]() {
                    return getNumber3Iterator(this._buffer);
                }
            }

            const update = () => {
                if (!buffers.value) return;
                const { vertexBuffer, propBuffers, indexBuffer } = buffers.value;

                // 计算一下包围盒大小！
                const { minPos, maxPos } = getMinMaxCorner(new Number3sIterable(vertexBuffer));
                czmCustomPrimitive.setLocalAxisedBoundingBox(minPos, maxPos);

                // let ratio = sceneObject.ratio ?? ESDataMesh.defaults.ratio;
                const maxNum = (sceneObject.maxTime ?? ESDataMesh.defaults.maxTime) | 0;
                let ratio = (sceneObject.currentTime ?? ESDataMesh.defaults.currentTime) / maxNum;

                ratio = ratio < 0 ? 0 : ((ratio > 1) ? 1 : ratio); // 确保在0-1之间！
                const r = ratio * maxNum;
                let i = (ratio * maxNum | 0);
                let rr = r - i;
                if (i >= maxNum) {
                    i = maxNum - 1;
                    rr = 1.0;
                }

                if (!Number.isFinite(rr)) {
                    console.error(`!Number.isFinite(rr)`);
                    debugger;
                    return;
                }

                czmCustomPrimitive.indexTypedArray = indexBuffer;
                if (!propBuffers[i] || !propBuffers[i + 1]) {
                    console.error(`!propBuffers[i] || !propBuffers[i + 1]`);
                    debugger;
                }
                czmCustomPrimitive.attributes = {
                    a_position: { typedArray: vertexBuffer, componentsPerAttribute: 3 },
                    a_prop: { typedArray: propBuffers[i], componentsPerAttribute: 3 },
                    a_prop2: { typedArray: propBuffers[i + 1], componentsPerAttribute: 3 },
                };
                czmCustomPrimitive.uniformMap = {
                    "u_gradientMap": {
                        "type": "texture",
                        "id": `${czmTexture.id}`
                    },
                    "u_stripMinMaxValue": [
                        sceneObject.minPropValue ?? ESDataMesh.defaults.minPropValue,
                        sceneObject.maxPropValue ?? ESDataMesh.defaults.maxPropValue,
                    ],
                    "u_ratio": rr
                };
            };
            update();
            this.dispose(sceneObject.maxTimeChanged.disposableOn(update));
            this.dispose(sceneObject.currentTimeChanged.disposableOn(update));
            this.dispose(sceneObject.minPropValueChanged.disposableOn(update));
            this.dispose(sceneObject.maxPropValueChanged.disposableOn(update));
            this.dispose(buffers.changed.disposableOn(update));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmCustomPrimitive } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            flyWithPrimitive(czmViewer, sceneObject, id, duration, czmCustomPrimitive, true);
            return true;
        }
    }
}
