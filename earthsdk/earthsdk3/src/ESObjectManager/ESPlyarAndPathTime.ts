import { ESPath, ESPlayer } from "../ESObjects";
import { Destroyable, ObjResettingWithEvent } from "xbsj-base";
import { ESObjectsManager } from ".";
import { SceneObjectsListening } from "./SceneObjectsListening";

export class ESPlyarAndPathTime extends Destroyable {
    constructor(private _esObjectsManager: ESObjectsManager) {
        super();
        {
            const esObjectsManager = this._esObjectsManager;

            // 时间和路径绑定，时间驱动路径变化 vtxf 20231019
            class ESPathTime extends Destroyable {
                constructor(private _esPath: ESPath) {
                    super();
                    this.dv(new ObjResettingWithEvent(esObjectsManager.activeViewerChanged, () => {
                        const viewer = esObjectsManager.activeViewer
                        if (!viewer) return undefined;
                        class T extends Destroyable {
                            constructor(private _esPath: ESPath) {
                                super();
                                if (!viewer) throw new Error(`!viewer`);
                                const update = () => {
                                    const viewer = esObjectsManager.activeViewer
                                    if (!viewer) return;
                                    this._esPath.path.currentTime = viewer.simulationTime;
                                }
                                update();
                                this.d(viewer.simulationTimeChanged.don(update))
                            }
                        }
                        return new T(this._esPath);
                    }));
                }
            }
            const esPathListening = this.dv(new SceneObjectsListening(esObjectsManager.sceneObjectsManager, sceneObject => {
                if (!(sceneObject instanceof ESPath)) return undefined;
                return new ESPathTime(sceneObject);
            }));
        }
        {
            const esObjectsManager = this._esObjectsManager;
            // 时间和播放器绑定，播放器驱动时间变化 vtxf 20231019
            class ESPlayerTime extends Destroyable {
                constructor(esPlayer: ESPlayer) {
                    super();
                    {
                        const update = () => {
                            const viewer = esObjectsManager.activeViewer
                            if (!viewer) return;
                            viewer.simulationTime = esPlayer.currentTime ?? 0;
                        };
                        update();
                        this.d(esPlayer.currentTimeChanged.don(update))
                    }
                }
            }

            const esPlayerListening = this.dv(new SceneObjectsListening(esObjectsManager.sceneObjectsManager, sceneObject => {
                if (!(sceneObject instanceof ESPlayer)) return undefined;
                return new ESPlayerTime(sceneObject);
            }));
        }
    }
}
