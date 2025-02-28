import { Destroyable, Event, Listener } from "xbsj-base";
import { ESVOption } from "../ESJTypes";
import { ESViewer } from "../ESViewer";
import { SceneObjectsManager } from "./SceneObjectsManager";
import { hasSameViewerTags } from "../utils";

export class ViewersManager extends Destroyable {

    private _viewersChanged = this.disposeVar(new Event<[toDels: ESViewer[], toAdds: ESViewer[]]>());
    get viewersChanged() { return this._viewersChanged; }

    private _viewers = new Set<ESViewer>();
    get viewers() { return this._viewers as Readonly<Set<ESViewer>>; }
    getViewers() { return [...this._viewers] as Readonly<ESViewer[]>; }

    private _viewersToChange = this.dv(new Event<[toDels: ESViewer[], toAdds: ESViewer[]]>());
    get viewersToChange() { return this._viewersToChange as Listener<[toDels: ESViewer[], toAdds: ESViewer[]]>; }

    createViewer<T extends ESViewer>(option: ESVOption) {
        const viewer = ESViewer.context.createViewer(option);
        this._viewers.add(viewer);
        this._viewersChanged.emit([], [viewer]);
        return viewer as T;
    }

    destroyViewer<T extends ESViewer>(viewer: T) {
        if (viewer.isDestroyed()) return true;
        this._viewers.delete(viewer);
        this._viewersChanged.emit([viewer], []);
        viewer.destroy();
        return viewer.isDestroyed();
    }

    constructor(private _sceneObjectsManager: SceneObjectsManager) {
        super();

        this.d(() => {
            for (const viewer of this._viewers) { this.destroyViewer(viewer) }
            this._viewers.clear();
        });

        //初始化创建所有对象
        this.viewers.forEach((viewer) => {
            const objs = this._sceneObjectsManager.sceneObjects;
            viewer.add(...objs);
        })

        //销毁时处理对象
        this.d(() => {
            const objs = this._sceneObjectsManager.sceneObjects;
            this.viewers.forEach((viewer) => { viewer.delete(...objs); })
        })

        //内部对象变化后处理对象
        this.d(this._sceneObjectsManager.sceneObjectsToChange.don((toDels, toAdds) => {
            this.viewers.forEach((viewer) => {
                toAdds.forEach((sceneObject) => {
                    if (hasSameViewerTags(viewer.devTags, sceneObject.devTags)) {
                        if (viewer.has(sceneObject)) {
                            console.warn(`${viewer.typeName}中已存${sceneObject.typeName},检查逻辑是否有问题！`);
                        } else {
                            viewer.add(sceneObject);
                        }
                    }
                });
                toDels.forEach((sceneObject) => {
                    if (hasSameViewerTags(viewer.devTags, sceneObject.devTags)) {
                        if (!viewer.has(sceneObject)) {
                            console.warn(`${viewer.typeName}中不存在${sceneObject.typeName},检查逻辑是否有问题！`);;
                        } else {
                            viewer.delete(sceneObject);
                        }
                    }
                })

            })

            //新增对象后处理对象,如果新增对象有devTags，则将对象添加到有相同devTags的视图中,否则添加到所有视图中
            if (toAdds.length > 0) {
                toAdds.forEach((sceneObject) => {
                    sceneObject.d(sceneObject.devTagsChanged.don(() => {
                        this.viewers.forEach((viewer) => {
                            viewer.has(sceneObject) && viewer.delete(sceneObject);
                            console.log('sceneObjectsToChange', viewer.devTags, sceneObject.devTags, hasSameViewerTags(viewer.devTags, sceneObject.devTags));
                            if (hasSameViewerTags(viewer.devTags, sceneObject.devTags)) {
                                if (viewer.has(sceneObject)) {
                                    console.warn(`${viewer.typeName}中已存${sceneObject.typeName},检查逻辑是否有问题！`);
                                } else {
                                    viewer.add(sceneObject);
                                }
                            }
                        })
                    }))
                })
            }
        }));


        //视口变化后处理对象
        this.d(this.viewersChanged.don((toDelvs, toAddvs) => {
            const objs = this._sceneObjectsManager.sceneObjects;
            toAddvs.forEach((viewer) => {
                for (let sceneObject of objs) {
                    if (hasSameViewerTags(viewer.devTags, sceneObject.devTags)) {
                        if (viewer.has(sceneObject)) {
                            console.warn(`${viewer.typeName}中已存${sceneObject.typeName},检查逻辑是否有问题！`);
                        } else {
                            viewer.add(sceneObject);
                        }
                    }
                };
            });
            toDelvs.forEach((viewer) => {
                for (let sceneObject of objs) {
                    if (hasSameViewerTags(viewer.devTags, sceneObject.devTags)) {
                        if (!viewer.has(sceneObject)) {
                            console.warn(`${viewer.typeName}中不存在${sceneObject.typeName},检查逻辑是否有问题！`);;
                        } else {
                            viewer.delete(sceneObject);
                        }
                    }
                }
            });

            //新增视口时监听devTags变化,当devTags变化时，重新处理对象
            if (toAddvs.length > 0) {
                toAddvs.forEach((viewer) => {
                    viewer.d(viewer.devTagsChanged.don(() => {
                        viewer.clearAllSceneObjects();
                        const sceneObjects = this._sceneObjectsManager.sceneObjects;
                        for (let sObject of sceneObjects) {
                            console.log('viewersChanged', viewer.devTags, sObject.devTags, hasSameViewerTags(viewer.devTags, sObject.devTags));
                            if (hasSameViewerTags(viewer.devTags, sObject.devTags)) {
                                if (viewer.has(sObject)) {
                                    console.warn(`${viewer.typeName}中已存${sObject.typeName},检查逻辑是否有问题！`);
                                } else {
                                    viewer.add(sObject);
                                }
                            }
                        }
                    }))
                });
            }
        }));
    }
}
