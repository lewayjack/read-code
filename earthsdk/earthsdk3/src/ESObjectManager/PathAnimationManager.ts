import { ESPath, ESPlayer, ESSceneObject } from "../ESObjects";
import { Destroyable, ObjResettingWithEvent, reactArray } from "xbsj-base";
import { ESObjectsManager } from ".";

type ChannelType = { pathId: string, sceneObjectIds: string[] };
type ObjChannelType = { path: ESPath, sceneObjects: ESSceneObject[] };
class ChannelsResetting extends Destroyable {
    constructor(objChannels: ObjChannelType[]) {
        super();

        objChannels.forEach(channel => {
            this.d(channel.path.currentPositionChanged.don((position) => {
                if (!position) return;
                channel.sceneObjects.forEach((sceneObject) => {
                    const flag = Reflect.has(sceneObject, "position");
                    //@ts-ignore
                    flag && (sceneObject.position = [...position]);
                })
            }))

            this.d(channel.path.currentRotationChanged.don((rotation) => {
                if (!rotation) return;
                channel.sceneObjects.forEach((sceneObject) => {
                    const flag = Reflect.has(sceneObject, "rotation");
                    //@ts-ignore
                    flag && (sceneObject.rotation = [...rotation]);
                })
            }))
        });
    }
}
export class PathAnimationManager extends Destroyable {
    private _player;
    get player() { return this._player; }

    private _channels = this.dv(reactArray<ChannelType[]>([]));
    get channels() { return this._channels.value; }
    get channelsChanged() { return this._channels.changed; }
    set channels(value: ChannelType[]) { this._channels.value = value; }
    constructor(private _objectManager: ESObjectsManager) {
        super();
        this._player = this._objectManager.createSceneObjectFromClass(ESPlayer) as ESPlayer;
        this.dv(new ObjResettingWithEvent(this.channelsChanged, () => {
            if (this.channels.length === 0) return undefined;
            const objChannels: ObjChannelType[] = []
            for (let i = 0; i < this.channels.length; i++) {
                const channel = this.channels[i];
                const path = ESSceneObject.getSceneObjById(channel.pathId);
                if (!path || !(path instanceof ESPath)) continue;
                const sceneObjects = channel.sceneObjectIds.map((id) => { return ESSceneObject.getSceneObjById(id) })
                //去除数组中的undefined
                const sceneObjectsFiltered = sceneObjects.filter((obj) => { return obj !== undefined; }) as ESSceneObject[];
                if (sceneObjectsFiltered.length === 0) continue;
                objChannels.push({ path, sceneObjects: sceneObjectsFiltered });
            }
            if (objChannels.length === 0) return undefined;
            return new ChannelsResetting(objChannels);
        }))
    }
}
