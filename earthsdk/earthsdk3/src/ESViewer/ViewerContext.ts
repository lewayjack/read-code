import { Destroyable } from "xbsj-base";
import { ESViewer } from "./index";
import { ESVOption, ViewerObjsMap } from "../ESJTypes";
export class ViewerContext extends Destroyable {
    public registerObjsMap: ViewerObjsMap = new Map();
    register<T extends ESViewer>(viewerType: string, viewerConstructor: new (option: ESVOption) => T) {
        if (this.registerObjsMap.has(viewerType)) {
            console.warn(`register warn:${viewerType}已经被注册,再次注册会覆盖。`);
        }
        this.registerObjsMap.set(viewerType, viewerConstructor);
        return viewerType;
    }

    getViewerConstructor<T extends ESViewer>(viewerType: string) {
        const viewerConstructor = this.registerObjsMap.get(viewerType);
        if (!viewerConstructor) {
            console.warn(`未找到${viewerType}类!`)
            return undefined;
        }
        return viewerConstructor as unknown as (new (option: ESVOption) => T);
    }

    createViewer<T extends ESViewer>(option: ESVOption) {
        const viewerType = option.type;
        const viewerConstructor = this.getViewerConstructor(viewerType);
        if (!viewerConstructor) {
            throw new Error(`没有找到类型为${viewerType}的Viewer构造器!`);
        }
        const viewer = new viewerConstructor(option) as T;
        return viewer;
    }
}
