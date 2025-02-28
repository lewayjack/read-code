import { ESPath } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESGeoVector } from "../../base";

export class UeESPath<T extends ESPath = ESPath> extends UeESGeoVector<T> {
    static readonly type = this.register<ESPath, ESUeViewer>("ESUeViewer", ESPath.type, this);

    static override forceUeUpdateProps = [
        ...UeESGeoVector.forceUeUpdateProps,
    ];

    static override propValFuncs = {
        ...UeESGeoVector.propValFuncs,
        materialMode: null,
    };
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        {
            // 兼容旧的属性，后期不支持设置purple和blue
            const update = () => {
                let materialMode = sceneObject.materialMode === "blue"
                    ? "multipleArrows"
                    : sceneObject.materialMode === "purple"
                        ? "singleArrow"
                        : sceneObject.materialMode;
                viewer.callUeFunc({
                    f: 'update',
                    p: {
                        id: sceneObject.id,
                        materialMode: materialMode,
                    }
                })
            };
            this.dispose(sceneObject.materialModeChanged.disposableOn(update));
            this.dispose(sceneObject.createdEvent.disposableOn(update));
        }
    }
}
