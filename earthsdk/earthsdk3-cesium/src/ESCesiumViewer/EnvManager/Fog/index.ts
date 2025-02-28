const fragmentShaderSource = `
  float getDistance(sampler2D depthTexture, vec2 texCoords)
  {
      float depth = czm_unpackDepth(texture(depthTexture, texCoords));
      if (depth == 0.0) {
          return czm_infinity;
      }
      vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
      return -eyeCoordinate.z / eyeCoordinate.w;
  }
  float interpolateByDistance(vec4 nearFarScalar, float distance)
  {
      float startDistance = nearFarScalar.x;
      float startValue = nearFarScalar.y;
      float endDistance = nearFarScalar.z;
      float endValue = nearFarScalar.w;
      float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
      return mix(startValue, endValue, t);
  }
  vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor)
  {
      return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a);
  }
  uniform sampler2D colorTexture;
  uniform sampler2D depthTexture;
  uniform vec4 fogByDistance;
  uniform vec4 fogColor;
  in vec2 v_textureCoordinates;
  void main(void)
  {
      float distance = getDistance(depthTexture, v_textureCoordinates);
      vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
      float blendAmount = interpolateByDistance(fogByDistance, distance);
      vec4 finalFogColor = vec4(fogColor.rgb, fogColor.a * blendAmount);
      out_FragColor = alphaBlend(finalFogColor, sceneColor);
  }
  `;
import * as Cesium from 'cesium';
import { Destroyable, react } from 'xbsj-base';
import { ESCesiumViewer } from '../../index';

export class Fog extends Destroyable {
    private _show = this.dv(react<boolean>(false));
    get show() { return this._show.value; }
    set show(value: boolean) { this._show.value = value; }
    get showChanged() { return this._show.changed; }

    postProcess: Cesium.PostProcessStage | undefined;

    constructor(czmViewer: ESCesiumViewer) {
        super();

        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return
        }
        //TODO: 后续通过这里设置雾0~1的参数;高度超过多少后就慢慢消失
        const reset = () => {
            if (this.postProcess) {
                viewer.scene.postProcessStages.remove(this.postProcess);
                this.postProcess = undefined;
            }
        };
        this.d(reset);

        const update = () => {
            reset();
            if (this.show ?? true) {
                if (!this.postProcess) {
                    this.postProcess = new Cesium.PostProcessStage({
                        name: 'earthsdk3_fog',
                        fragmentShader: fragmentShaderSource,
                        uniforms: {
                            fogByDistance: new Cesium.Cartesian4(10, 0.0, 1000, 0.9),//TODO:后续通过这里设置雾0~1的参数;
                            fogColor: Cesium.Color.WHITE,
                        },
                    });
                    viewer.scene.postProcessStages.add(this.postProcess);
                }
            }
        }
        update();
        this.d(this.showChanged.don(update));
    }
}
