
import * as Cesium from 'cesium';
import { Destroyable, react } from 'xbsj-base';
import { ESCesiumViewer } from '../../index';

const rainglsl = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

float hash(float x){
    return fract(sin(x*133.3)*13.13);
}

void main(void){

    float time = czm_frameNumber / 60.0;
    vec2 resolution = czm_viewport.zw;

    vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
    vec3 c=vec3(.6,.7,.8);

    float a=-.4;
    float si=sin(a),co=cos(a);
    uv*=mat2(co,-si,si,co);
    uv*=length(uv+vec2(0,4.9))*.3+1.;

    float v=1.-sin(hash(floor(uv.x*100.))*2.);
    float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;
    c*=v*b; //屏幕上雨的颜色

    out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c,1), 0.5); 
}
`;

export class Rain extends Destroyable {

    private _show = this.dv(react<boolean>(false));
    get show() { return this._show.value; }
    set show(value: boolean) { this._show.value = value; }
    get showChanged() { return this._show.changed; }

    rainPostProcess: Cesium.PostProcessStage | undefined;

    constructor(czmViewer: ESCesiumViewer) {
        super();

        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return
        }

        const resetRain = () => {
            if (this.rainPostProcess) {
                viewer.scene.postProcessStages.remove(this.rainPostProcess);
                this.rainPostProcess = undefined;
            }
        };
        this.d(resetRain);

        const updateRain = () => {
            resetRain();

            if (this.show ?? true) {
                if (!this.rainPostProcess) {
                    this.rainPostProcess = new Cesium.PostProcessStage({
                        name: 'earthsdk3_rain',
                        fragmentShader: rainglsl,//TODO:后续需要0~1控制
                    });
                    viewer.scene.postProcessStages.add(this.rainPostProcess);
                }
            }
        }
        updateRain();
        this.d(this.showChanged.don(updateRain));
    }
}
