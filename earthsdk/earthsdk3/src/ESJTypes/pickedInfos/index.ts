import { ESSceneObject } from "../../ESObjects";

export class PickedInfo {
    constructor(public childPickedInfo?: PickedInfo) { }
    static getFinalAttachedInfo(pickedInfo: PickedInfo) {
        let finalPickedInfo = pickedInfo;
        while (finalPickedInfo.childPickedInfo) {
            finalPickedInfo = finalPickedInfo.childPickedInfo;
        }
        if (finalPickedInfo instanceof AttachedPickedInfo) {
            return finalPickedInfo.attachedInfo;
        }
        return undefined;
    }
}

export class AttachedPickedInfo extends PickedInfo {
    constructor(public attachedInfo: any, childPickedInfo?: PickedInfo) {
        super(childPickedInfo);
    }
}
export class ESJPickedInfo {
    constructor(public pickedInfo?: any, public attachedInfo?: any) {
    }
}
export class DivPickedInfo extends PickedInfo {
    constructor(public element: any, childPickedInfo?: PickedInfo) {
        super(childPickedInfo);
    }
}

export class SceneObjectPickedInfo extends PickedInfo {
    constructor(public sceneObject: ESSceneObject, childPickedInfo?: PickedInfo) {
        super(childPickedInfo);
    }
}


export type ESJPickResultType = SceneObjectPickedInfo | { childPickedInfo: PickedInfo | undefined, sceneObject: undefined }



export class PickedResult {
    constructor(
        public pickResult?: any,
        public sceneObject?: ESSceneObject,
        public tilesetPickInfo?: any,
        public geojsonPickInfo?: any,
        public attachedInfo?: any,
    ) { }
}
