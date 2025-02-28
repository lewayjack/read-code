import { ESImageLabel, ESSceneObject, rpToap } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESLabel } from "../../../UeObjects/base";

export class UeESImageLabel<T extends ESImageLabel = ESImageLabel> extends UeESLabel<T> {
    static readonly type = this.register<ESImageLabel, ESUeViewer>('ESUeViewer', ESImageLabel.type, this);

    static override forceUeUpdateProps = [
        ...UeESLabel.forceUeUpdateProps,
        'url',
    ];

    static override  propValFuncs = {
        ...UeESLabel.propValFuncs,
        url: (val: string) => ESSceneObject.context.getStrFromEnv(rpToap(val)),
    };

    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        sceneObject.anchor = [0.5, 1]
    }
}
