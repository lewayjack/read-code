import { JsonValue } from "xbsj-base";
import { SceneTreeItemJsonValue } from "./SceneTreeItem";
import { SceneTreeJsonValue } from "./index";
const filterTypes = ['EnvironmentVariables', 'ScriptsLoader', 'SceneScript', 'ScriptLoader'];

function _treverseSceneTreeJson(sceneTreeJson: { root: SceneTreeItemJsonValue }) {
    const objJsons: JsonValue[] = [];
    const { root = {} } = sceneTreeJson;
    const todos = [root];
    while (todos.length > 0) {
        const todo = todos.pop();
        if (!todo) {
            throw new Error(`!todo`);
        }
        if (todo.children) {
            for (let treeItem of todo.children) {
                if (treeItem.children) {
                    todos.unshift(treeItem);
                }

                if (treeItem.sceneObj) {
                    const { type = undefined } = treeItem.sceneObj as { type?: string };
                    if (!type) {
                        console.warn(`sceneObjJson has no type! treeItem.sceneObj: `);
                        console.warn(treeItem.sceneObj);
                    }
                    if (type && filterTypes.includes(type)) {
                        objJsons.push(treeItem.sceneObj);
                    }
                }
            }
        }
    }
    return objJsons;
}

export type PreloadFuncType = (sceneTreeJson: SceneTreeJsonValue, progressFunc?: PreloadProgressFuncType) => Promise<void>;

export type PreloadProgressFuncType = (ratio: number, done: number, total: number) => void;

/**
 * 场景文件中有一些东西是需要提前加载和处理的，所以就有了这个特殊的函数
 * @param sceneTreeJson 
 */
export async function preload(sceneTreeJson: SceneTreeJsonValue, progressFunc?: PreloadProgressFuncType) {
    const objJsons = _treverseSceneTreeJson(sceneTreeJson);
    let done = 0;
    const total = objJsons.length;
    for (let objJson of objJsons) {
        const sceneObjJson = objJson as { type: string };
        // ysp 实测这四个对象很少用到，所以暂时不处理

        // if (sceneObjJson.type === 'EnvironmentVariables') {
        //     const environmentVariables = ESSceneObject.createFromJson<EnvironmentVariables>(sceneObjJson as any);
        //     environmentVariables?.destroy();
        // } else if (sceneObjJson.type === 'ScriptLoader') {
        //     const scriptLoader = ESSceneObject.createFromJson<ScriptLoader>(sceneObjJson as any);
        //     if (scriptLoader) {
        //         if (scriptLoader.enabled ?? true) {
        //             await scriptLoader.load();
        //         }
        //         scriptLoader.destroy();
        //     }
        // } else if (sceneObjJson.type === 'ScriptsLoader') {
        //     const scriptsLoader = ESSceneObject.createFromJson<ScriptsLoader>(sceneObjJson as any);
        //     if (scriptsLoader) {
        //         if (scriptsLoader.enabled ?? true) {
        //             await scriptsLoader.load();
        //         }
        //         scriptsLoader.destroy();
        //     }
        // } else if (sceneObjJson.type === 'SceneScript') {
        //     const sceneScript = ESSceneObject.createFromJson<SceneScript>(sceneObjJson as any);
        //     if (sceneScript) {
        //         if (sceneScript.runOnLoaded) {
        //             const result = sceneScript.exec();
        //             if (result instanceof Promise) {
        //                 await result;
        //             }
        //         }
        //         sceneScript.destroy();
        //     }
        // } else {
        //     console.warn(`preload warn：sceneObjJson.type: ${sceneObjJson.type} cannot be handled!`);
        // }

        ++done;
        if (progressFunc) {
            const ratio = done / total;
            progressFunc(ratio, done, total);
        }
    }
}
