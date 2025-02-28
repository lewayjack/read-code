import {
    addTreesCallFunc, cutDownTreesCallFunc, ESSeparateFoliage,
    ESTreeParam, growthSimulationCallFunc, removeAllTreesCallFunc,
    updateTreeParamsCallFunc
} from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESVisualObject } from "../../base";

export class UeESSeparateFoliage extends UeESVisualObject<ESSeparateFoliage> {
    static readonly type = this.register('ESUeViewer', ESSeparateFoliage.type, this);
    constructor(sceneObject: ESSeparateFoliage, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this.d(sceneObject.addTreesEvent.don((TreeParams: ESTreeParam[]) => {
            addTreesCallFunc(ueViewer, sceneObject.id, TreeParams)
        }));

        this.d(sceneObject.removeAllTreesEvent.don(() => {
            removeAllTreesCallFunc(ueViewer, sceneObject.id,)
        }));

        this.d(sceneObject.updateTreeParamsEvent.don((TreeParams: ESTreeParam[]) => {
            updateTreeParamsCallFunc(ueViewer, sceneObject.id, TreeParams)
        }));

        this.d(sceneObject.cutDownTreesEvent.don((TreeIds, TimeLength) => {
            cutDownTreesCallFunc(ueViewer, sceneObject.id, TreeIds, TimeLength)
        }));

        this.d(sceneObject.growthSimulationEvent.don((ToParams, TimeLength, SwitchTime) => {
            growthSimulationCallFunc(ueViewer, sceneObject.id, ToParams, TimeLength, SwitchTime)
        }));
    }
}
