import * as Cesium from 'cesium';
import { Destroyable, extendClassProps, UniteChanged } from "xbsj-base";
import { ESCesiumViewer } from "../../index";

export class DepthOfField extends Destroyable {

    constructor(czmViewer: ESCesiumViewer) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return
        }

        const postProcessStage = viewer.scene.postProcessStages.add(Cesium.PostProcessStageLibrary.createDepthOfFieldStage());
        this.d(() => viewer.scene.postProcessStages.remove(postProcessStage));


        {
            const update = () => { postProcessStage.enabled = this.show; }
            update();
            this.d(this.showChanged.don(update));
        }

        {
            const update = () => { postProcessStage.uniforms.fogByDistance = this.focalDistance; }
            update();
            this.d(this.focalDistanceChanged.don(update));
        }
        {
            const update = () => { postProcessStage.uniforms.delta = this.delta; }
            update();
            this.d(this.deltaChanged.don(update));
        }
        {
            const update = () => { postProcessStage.uniforms.sigma = this.sigma; }
            update();
            this.d(this.sigmaChanged.don(update));
        }
        {
            const update = () => { postProcessStage.uniforms.stepSize = this.stepSize; }
            update();
            this.d(this.stepSizeChanged.don(update));
        }
    }
}

export namespace DepthOfField {
    export const createDefaultProps = () => ({
        show: false,
        focalDistance: 87,
        delta: 1,
        sigma: 3.78,
        stepSize: 2.46,
    });
}
extendClassProps(DepthOfField.prototype, DepthOfField.createDefaultProps);
export interface DepthOfField extends UniteChanged<ReturnType<typeof DepthOfField.createDefaultProps>> { }
