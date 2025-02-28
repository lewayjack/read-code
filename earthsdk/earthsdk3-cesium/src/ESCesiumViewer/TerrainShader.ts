import { Destroyable } from "xbsj-base";
import { ESCesiumViewer } from "./index";
import { CzmGlobeMaterial } from "../CzmObjects";

export class TerrainShader extends Destroyable {
    private _czmGlobeMaterial;
    get czmGlobeMaterial() { return this._czmGlobeMaterial; }
    constructor(private _czmViewer: ESCesiumViewer) {
        super();
        this._czmGlobeMaterial = this.dv(new CzmGlobeMaterial(_czmViewer));
        this._czmGlobeMaterial.show = true;
        const update = () => {
            const tempParam = Object.assign({}, ESCesiumViewer.defaults.terrainShader, this._czmViewer.terrainShader);
            this._czmGlobeMaterial.shadingMode = 'none';
            tempParam.aspect.show && (this._czmGlobeMaterial.shadingMode = 'aspect');
            tempParam.slope.show && (this._czmGlobeMaterial.shadingMode = 'slope');
            tempParam.elevationRamp.show && (this._czmGlobeMaterial.shadingMode = 'elevation');
            // this._czmGlobeMaterial.enableContour = cameraHeight <= tempParam.elevationContour.spacing * 1000 && tempParam.elevationContour.show;
            this._czmGlobeMaterial.contourSpacing = tempParam.elevationContour.spacing;
            this._czmGlobeMaterial.contourWidth = tempParam.elevationContour.width;
            this._czmGlobeMaterial.contourColor = tempParam.elevationContour.color;
            let cameraListener = this._czmViewer.viewer?.scene.preUpdate.addEventListener(() => {
                const cameraHeight = this._czmViewer.getCameraInfo()?.position[2] ?? 0;
                this._czmGlobeMaterial.enableContour = cameraHeight <= tempParam.elevationContour.spacing * 1000 && tempParam.elevationContour.show;
            })
            this.d(() => { cameraListener && cameraListener() });
        }
        update()
        this.d(this._czmViewer.terrainShaderChanged.don(update));
    }
}
