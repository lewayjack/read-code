import { ESSceneObject, ESSubmergingAnalysis } from "earthsdk3";
import { CzmCustomPrimitive, CzmESObjectWithLocation, CzmTexture } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { WaterAttributeType } from "../../../ESJTypesCzm";
import { flyWithPrimitive } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
export const waterType = {
    river: {
        // 颜色提高亮度
        waterColor: [95 / 255, 115 / 255, 70 / 255, 1],
        frequency: 800,
        waveVelocity: 0.6,
        amplitude: 0.1,
        specularIntensity: 0.8,
        flowDirection: 0,
        flowSpeed: 0
    },
    ocean: {
        // 颜色提高亮度
        waterColor: [12 / 255, 30 / 255, 69 / 255, 1],
        frequency: 360,
        waveVelocity: 0.8,
        amplitude: 0.5,
        specularIntensity: 0.8,
        flowDirection: 0,
        flowSpeed: 0
    },
    lake: {
        // 颜色提高亮度
        waterColor: [32 / 255, 84 / 255, 105 / 255, 1],
        frequency: 200,
        waveVelocity: 0.4,
        amplitude: 0.01,
        specularIntensity: 0.8,
        flowDirection: 0,
        flowSpeed: 0
    },
} as {
    [xx: string]: WaterAttributeType
}
export class CzmESSubmergingAnalysis extends CzmESObjectWithLocation<ESSubmergingAnalysis> {
    static readonly type = this.register("ESCesiumViewer", ESSubmergingAnalysis.type, this);
    //自定义图元
    private _czmCustomPrimitive;
    get czmCustomPrimitive() { return this._czmCustomPrimitive; }
    //贴图
    private _causticsTexture;
    get causticsTexture() { return this._causticsTexture; }

    private _foamTexture;
    get foamTexture() { return this._foamTexture; }

    private _heightMapTexture;
    get heightMapTexture() { return this._heightMapTexture; }

    private _normalMapTexture;
    get normalMapTexture() { return this._normalMapTexture; }

    constructor(sceneObject: ESSubmergingAnalysis, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmCustomPrimitive = this.dv(new CzmCustomPrimitive(czmViewer, sceneObject.id));
        this._causticsTexture = this.dv(new CzmTexture(czmViewer));
        this._foamTexture = this.dv(new CzmTexture(czmViewer));
        this._heightMapTexture = this.dv(new CzmTexture(czmViewer));
        this._normalMapTexture = this.dv(new CzmTexture(czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        // 初始化
        const czmCustomPrimitive = this.czmCustomPrimitive;
        // 添加纹理
        const causticsTexture = this.causticsTexture;
        const foamTexture = this.foamTexture;
        const heightMapTexture = this.heightMapTexture;
        const normalMapTexture = this.normalMapTexture;
        {
            // 加载贴图
            causticsTexture.uri = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/water/caustics.jpg');
            foamTexture.uri = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/water/foam.jpg');
            heightMapTexture.uri = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/water/heightmap.jpg');
            normalMapTexture.uri = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/water/water_normalmap.png');
        }

        this.d(track([czmCustomPrimitive, 'show'], [sceneObject, 'show']));
        this.d(track([czmCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.d(bind([czmCustomPrimitive, 'position'], [sceneObject, 'position']));
        this.d(bind([czmCustomPrimitive, 'rotation'], [sceneObject, 'rotation']));
        this.d(bind([czmCustomPrimitive, 'scale'], [sceneObject, 'scale']));
        {
            // 初始化水面shader
            czmCustomPrimitive.pass = 'TRANSLUCENT';
            czmCustomPrimitive.primitiveType = 'TRIANGLES';
            czmCustomPrimitive.renderState = {
                "depthTest": {
                    "enabled": true
                },
                "cull": {
                    "enabled": true,
                    "face": 1029
                },
                "depthMask": true,
                "blending": {
                    "enabled": true,
                    "equationRgb": 32774,
                    "equationAlpha": 32774,
                    "functionSourceRgb": 770,
                    "functionSourceAlpha": 1,
                    "functionDestinationRgb": 771,
                    "functionDestinationAlpha": 771
                }
            }
            czmCustomPrimitive.vertexShaderSource = `
                in vec3 position;
                uniform sampler2D u_heightmap_image;
                out vec2 v_st;
                out vec3 v_positionEC;

                void main()
                {
                    v_st = position.xy * 0.01;

                    vec2 size = vec2(textureSize(u_heightmap_image, 0));
                    vec2 diff = vec2(fract(czm_frameNumber * 0.0002));
                    vec2 texcoordPre = fract(position.xy * 0.01 + diff);
                    vec2 texcoord = size * texcoordPre;
                    ivec2 coord = ivec2(texcoord);

                    vec4 texel00 = texelFetch(u_heightmap_image, coord + ivec2(0, 0), 0);
                    vec4 texel10 = texelFetch(u_heightmap_image, coord + ivec2(1, 0), 0);
                    vec4 texel11 = texelFetch(u_heightmap_image, coord + ivec2(1, 1), 0);
                    vec4 texel01 = texelFetch(u_heightmap_image, coord + ivec2(0, 1), 0);

                    vec2 sampleCoord = fract(texcoord.xy);

                    vec4 texel0 = mix(texel00, texel01, sampleCoord.y);
                    vec4 texel1 = mix(texel10, texel11, sampleCoord.y);

                    vec4 color = mix(texel0, texel1, sampleCoord.x);

                    vec2 transition = smoothstep(0.0, 0.1, texcoordPre) * smoothstep(1.0, 0.9, texcoordPre);
                    color *= (transition.x * transition.y);

                    float z = position.z + (color.r + color.g + color.b) * 0.3;

                    vec4 finalPos = vec4(position.xy, z, 1.0);
                    v_positionEC = (czm_modelView * finalPos).xyz;

                    gl_Position = czm_modelViewProjection * finalPos;
                }                
                `;
            czmCustomPrimitive.fragmentShaderSource = `
                in vec2 v_st;
                in vec3 v_positionEC;
                uniform sampler2D u_normalmap_image;
                uniform sampler2D u_foam_image;
                uniform sampler2D u_caustics_image;
                uniform vec4 u_color;

                float getDistance(sampler2D depthTexture, vec2 texCoords) 
                { 
                    float depth = czm_unpackDepth(texture(depthTexture, texCoords)); 
                    if (depth == 0.0) { 
                        return czm_infinity; 
                    } 
                    vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth); 
                    return -eyeCoordinate.z / eyeCoordinate.w; 
                } 

                void main()
                {
                    vec2 coords = gl_FragCoord.xy / czm_viewport.zw;
                    float distance = getDistance(czm_globeDepthTexture, coords);

                    vec2 diff0 = vec2(fract(czm_frameNumber * 0.00024));
                    vec2 diff1 = vec2(fract(czm_frameNumber * 0.00035));
                    vec4 caustics_image = texture(u_caustics_image, fract(v_st * 5.0 + diff0)) * 0.2;
                    vec4 foam_image = texture(u_foam_image, fract(v_st * 5.0 + diff1)) * 0.3;
                    out_FragColor = clamp(caustics_image + foam_image + u_color * 0.8, vec4(0), vec4(1.0));

                    float realDistance = -v_positionEC.z;
                    out_FragColor.rgb *= vec3(clamp((distance - realDistance)*.5, 0.5, 1.0));
                    out_FragColor.a = 0.9;
                }        
                `;
        }
        {
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.waterColorChanged,
                sceneObject.frequencyChanged,
                sceneObject.waveVelocityChanged,
                sceneObject.amplitudeChanged,
                sceneObject.specularIntensityChanged,
                sceneObject.waterTypeChanged,
                sceneObject.flowSpeedChanged,
                sceneObject.materialParamsChanged
            ))
            const update = () => {
                if (sceneObject.waterType === 'custom') {
                    this.updateWater({
                        waterColor: sceneObject.waterColor,
                        frequency: (sceneObject.frequency ?? ESSubmergingAnalysis.defaults.frequency) / 10,
                        waveVelocity: (sceneObject.waveVelocity ?? ESSubmergingAnalysis.defaults.waveVelocity) / 100,
                        amplitude: (sceneObject.amplitude ?? ESSubmergingAnalysis.defaults.amplitude) * 100,
                        specularIntensity: sceneObject.specularIntensity ?? ESSubmergingAnalysis.defaults.specularIntensity,
                        flowSpeed: sceneObject.flowSpeed ?? ESSubmergingAnalysis.defaults.flowSpeed,
                    });
                } else {
                    const waterAttribute = Object.assign({}, waterType[sceneObject.waterType]);
                    waterAttribute.frequency && (waterAttribute.frequency /= 10);
                    waterAttribute.waveVelocity && (waterAttribute.waveVelocity /= 100);
                    waterAttribute.amplitude && (waterAttribute.amplitude *= 10);
                    this.updateWater(waterAttribute)
                }
            }
            update();
            this.d(event.don(update));
        }
        {
            const update = (currentTime: number) => {
                if (currentTime == 0 || !this.isTimestamp(currentTime)) return;
                const allMoments = sceneObject.getAllMoments();
                const submergingData = sceneObject.getSubmergingData;
                if (allMoments.length == 0 || !submergingData) return;
                const timestampIndex = this.getClosestTimestampIndex(currentTime, allMoments);
                czmCustomPrimitive.attributes = {
                    position: {
                        typedArray: submergingData[timestampIndex].posBuffer,
                        componentsPerAttribute: 3
                    }
                }
                czmCustomPrimitive.indexTypedArray = submergingData[timestampIndex].indicesBuffer;
                //自动计算包围盒
                const minMax = czmCustomPrimitive.computeLocalAxisedBoundingBoxFromAttribute('position');
                if (!minMax) return;
                const { min, max } = minMax;
                czmCustomPrimitive.setLocalAxisedBoundingBox(min, max);
            }
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.currentTimeChanged,
                sceneObject.readyEvent
            ));
            this.d(event.don(() => {
                update(sceneObject.currentTime);
            }))
        }
    }
    private isTimestamp = (timestamp: number) => {
        const timestampStr = timestamp.toString();
        if (timestampStr.length !== 13) {
            console.log('时间戳格式错误');
            return false;
        }
        if (isNaN(timestamp)) {
            console.log('时间戳格式错误');
            return false;
        }
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            console.log('时间戳格式错误');
            return false;
        }
        return true;
    }
    private getClosestTimestampIndex = (currentTime: number, timestampArr: number[]) => {
        var closestTimestampIndex = 0;
        var closestDifference = Infinity;
        for (var i = 0; i < timestampArr.length; i++) {
            var difference = Math.abs(currentTime - timestampArr[i]);
            if (difference < closestDifference) {
                closestDifference = difference;
                closestTimestampIndex = i;
            }
        }
        return closestTimestampIndex;
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            flyWithPrimitive(czmViewer, sceneObject, id, duration, this.czmCustomPrimitive, true);
            return true;
        }
    }
    private updateWater(updateAttribute: WaterAttributeType) {
        const { czmCustomPrimitive, sceneObject, heightMapTexture, normalMapTexture, foamTexture, causticsTexture } = this;
        const color = sceneObject.materialParams[Object.keys(sceneObject.materialParams).filter(item => item.toUpperCase().includes("BASECOLOR"))[0]];
        // 设置图片
        czmCustomPrimitive.uniformMap = {
            "u_image": {
                "type": "texture",
                "id": heightMapTexture.id
            },
            "u_heightmap_image": {
                "type": "texture",
                "id": heightMapTexture.id
            },
            "u_normalmap_image": {
                "type": "texture",
                "id": normalMapTexture.id
            },
            "u_foam_image": {
                "type": "texture",
                "id": foamTexture.id
            },
            "u_caustics_image": {
                "type": "texture",
                "id": causticsTexture.id
            },
            "u_color": updateAttribute.waterColor ?? color ?? ESSubmergingAnalysis.defaults.waterColor
        };
    }
}
