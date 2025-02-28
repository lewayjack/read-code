import { EngineObjsMap } from "../ESJTypes";
import { ESSceneObject } from "../ESObjects";
import { ESViewer } from "../ESViewer";
import { EngineObject } from "./index";
import { Destroyable } from "xbsj-base";
export class EngineObjectsContext extends Destroyable {
    public registerEngines: { [key: string]: EngineObjsMap } = {};
    register<R extends ESSceneObject, V extends ESViewer>(viewerType: string, sceneObjectTypeName: string, objConstructor: new (sceneObject: R, viewer: V) => EngineObject<R>) {
        const objsMap: EngineObjsMap = this.registerEngines[viewerType] || new Map();
        if (objsMap.has(sceneObjectTypeName)) {
            console.warn(`register warn:${viewerType}中${sceneObjectTypeName}的实现类已经被注册,再次注册会覆盖。`);
        }
        //@ts-ignore
        objsMap.set(sceneObjectTypeName, objConstructor);
        this.registerEngines[viewerType] = objsMap;
    }

    getEngineObjConstructor<R extends ESSceneObject, V extends ESViewer>(sceneObjectTypeName: string, viewerType: string) {
        const objsMap: EngineObjsMap = this.registerEngines[viewerType] || new Map();
        const objConstructor = objsMap.get(sceneObjectTypeName);
        if (!objConstructor) {
            console.warn(`未找到${sceneObjectTypeName}在${viewerType}中对应的实现类!`);
            return undefined;
        } else {
            return objConstructor as unknown as (new (sceneObject: R, viewer: V) => EngineObject<R>);
        }
    }

    createEngineObject<R extends ESSceneObject, V extends ESViewer>(sceneObject: R, viewer: V) {
        const objConstructor = this.getEngineObjConstructor<R, V>(sceneObject.typeName, viewer.typeName);
        if (objConstructor) {
            const engineObj = new objConstructor(sceneObject, viewer);
            engineObj.createdEvent.emit();
            return engineObj;
        } else {
            //找到这行注释的，来找我领取一个大脖溜子！
            const engineObj = new EngineObject(sceneObject, viewer);
            engineObj.createdEvent.emit();
            return engineObj;
        }
    }
}
