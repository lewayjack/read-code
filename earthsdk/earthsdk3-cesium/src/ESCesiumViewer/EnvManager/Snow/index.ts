const snowglsl = `
uniform sampler2D colorTexture; //输入的场景渲染照片
in vec2 v_textureCoordinates;

float snow(vec2 uv,float scale)
{
    float time = czm_frameNumber / 60.0;
    float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;
    uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;
    uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;
    p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);
    k=smoothstep(0.,k,sin(f.x+f.y)*0.01);
    return k*w;
}

void main(void){
    vec2 resolution = czm_viewport.zw;
    vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
    vec3 finalColor=vec3(0);
    //float c=smoothstep(1.,0.3,clamp(uv.y*.3+.8,0.,.75));
    float c = 0.0;
    c+=snow(uv,30.)*.0;
    c+=snow(uv,20.)*.0;
    c+=snow(uv,15.)*.0;
    c+=snow(uv,10.);
    c+=snow(uv,8.);
    c+=snow(uv,6.);
    c+=snow(uv,5.);
    finalColor=(vec3(c)); //屏幕上雪的颜色
    out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5);  //将雪和三维场景融合
}
`

const snowCoverGlsl = `
#extension GL_OES_standard_derivatives : enable
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform float alpha;
in vec2 v_textureCoordinates;
vec4 toEye(in vec2 uv, in float depth) {
    vec2 xy = vec2((uv.x * 2.0 - 1.0), (uv.y * 2.0 - 1.0));
    vec4 posInCamera = czm_inverseProjection * vec4(xy, depth, 1.0);
    posInCamera = posInCamera / posInCamera.w;
    return posInCamera;
}
float getDepth(in vec4 depth) {
    float z_window = czm_unpackDepth(depth);
    z_window = czm_reverseLogDepth(z_window);
    float n_range = czm_depthRange.near;
    float f_range = czm_depthRange.far;
    return (2.0 * z_window - n_range - f_range) / (f_range - n_range);
}
void main() {
    vec4 color = texture(colorTexture, v_textureCoordinates);
    vec4 currD = texture(depthTexture, v_textureCoordinates);
    if(currD.r >= 1.0) {
        out_FragColor = color;
        return;
    }
    float depth = getDepth(currD);
    vec4 positionEC = toEye(v_textureCoordinates, depth);
    vec3 dx = dFdx(positionEC.xyz);
    vec3 dy = dFdy(positionEC.xyz);
    vec3 nor = normalize(cross(dx, dy));
    vec4 positionWC = normalize(czm_inverseView * positionEC);
    vec3 normalWC = normalize(czm_inverseViewRotation * nor);
    float dotNumWC = dot(positionWC.xyz, normalWC);
    if(dotNumWC <= 0.3) {
        out_FragColor = mix(color, vec4(1.0), alpha*0.3);
        return;
    }
    out_FragColor = mix(color, vec4(1.0), dotNumWC*alpha);
}
`;

import * as Cesium from 'cesium';
import { Destroyable, react } from 'xbsj-base';
import { ESCesiumViewer } from '../../index';

export class Snow extends Destroyable {

    private _show = this.dv(react<boolean>(false));
    get show() { return this._show.value; }
    set show(value: boolean) { this._show.value = value; }
    get showChanged() { return this._show.changed; }

    private _alpha = this.dv(react<number>(0));
    get alpha() { return this._alpha.value; }
    set alpha(value: number) { this._alpha.value = value; }
    get alphaChanged() { return this._alpha.changed; }
    snow: Cesium.PostProcessStage | undefined;
    snowCover: Cesium.PostProcessStage | undefined;

    constructor(czmViewer: ESCesiumViewer) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return
        }
        let { snow, snowCover } = this;

        const resetSnow = () => {
            if (snow) {
                viewer.scene.postProcessStages.remove(snow);
                snow = undefined;
            }
        };
        this.d(resetSnow);

        const resetSnowCover = () => {
            if (snowCover) {
                viewer.scene.postProcessStages.remove(snowCover);
                snowCover = undefined;
            }
        };
        this.d(resetSnowCover);

        const update = () => {
            if (!snowCover) return;
            const alpha = Cesium.Math.clamp(this.alpha, 0.0, 1.0);
            snowCover.uniforms.alpha = alpha;
        }
        update();
        this.d(this.alphaChanged.don(update));

        const recreate = () => {
            resetSnow();
            resetSnowCover();

            if (this.show ?? true) {
                snow = new Cesium.PostProcessStage({
                    name: 'earthsdk3_snow',
                    fragmentShader: snowglsl
                });
                viewer.scene.postProcessStages.add(snow);

                snowCover = new Cesium.PostProcessStage({
                    name: 'earthsdk3_snowCover',
                    fragmentShader: snowCoverGlsl,
                    uniforms: {
                        alpha: this.alpha,
                    }
                });
                viewer.scene.postProcessStages.add(snowCover);
                update();
            }
        };
        recreate();
        this.d(this.showChanged.don(recreate));
    }
}
