import { ESForestTileset, ESSceneObject } from "earthsdk3";
import { UeESVisualObject } from "../../base";
import { ESUeViewer } from "../../../ESUeViewer";
import { createNextAnimateFrameEvent } from "xbsj-base";

export class UeESForestTileset extends UeESVisualObject<ESForestTileset> {
    static readonly type = this.register('ESUeViewer', ESForestTileset.type, this);
    constructor(sceneObject: ESForestTileset, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const urlReact = this.dv(ESSceneObject.context.createEnvStrReact([sceneObject, 'url']));
        const update = () => {
            viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    url: urlReact.value ?? ESForestTileset.defaults.url,
                    treeTypes: sceneObject.treeTypes ?? ESForestTileset.defaults.treeTypes,
                    xiaoBanWidget: sceneObject.xiaoBanWidget ?? ESForestTileset.defaults.xiaoBanWidgetDefault,
                    youShiSZ: sceneObject.youShiSZ ?? ESForestTileset.defaults.youShiSZ,
                    diLei: sceneObject.diLei ?? ESForestTileset.defaults.diLei,
                    senLinLB: sceneObject.senLinLB ?? ESForestTileset.defaults.senLinLB,
                    labelMaterial: sceneObject.labelMaterial ?? ESForestTileset.defaults.labelMaterial,
                    heightOffset: sceneObject.heightOffset ?? ESForestTileset.defaults.heightOffset,
                }
            })
        };
        const updateEvent = this.dv(createNextAnimateFrameEvent(
            urlReact.changed,
            sceneObject.treeTypesChanged,
            sceneObject.xiaoBanWidgetChanged,
            sceneObject.youShiSZChanged,
            sceneObject.diLeiChanged,
            sceneObject.senLinLBChanged,
            sceneObject.labelMaterialChanged,
            sceneObject.heightOffsetChanged,
        ));
        this.d(updateEvent.don(update));
        this.d(sceneObject.createdEvent.don(update));
    }
}
