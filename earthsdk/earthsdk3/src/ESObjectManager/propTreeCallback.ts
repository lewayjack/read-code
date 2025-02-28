import { ESObjectsManager } from "./index";
import { DragStartDataManager, GroupPropTreeItem, LeafPropTreeItem, PropTree, SceneTreeItem } from "../utils";
import { getReactFuncs } from "xbsj-base";
import { PositionProperty, PositionsProperty, Property, String2sProperty, StringProperty, StringsProperty } from "../ESJTypes";

function getSceneObjId(dragstartDataMananger: DragStartDataManager) {
    if (dragstartDataMananger.data) {
        const { type, value } = dragstartDataMananger.data;
        if (type === 'UITreeA') {
            if (value instanceof SceneTreeItem) {
                const { sceneObject } = value;
                if (sceneObject) {
                    return sceneObject.id;
                }
            }
        }
    }
    return undefined;
}

export type PropertyCompCallbackFuncParamsType = {
    componentInstance: any;
    property: Property,
    customEventName: string,
    otherParams?: any[],
};

export type propTreeCallbackParamsType = PropertyCompCallbackFuncParamsType & {
    treeItem: GroupPropTreeItem | LeafPropTreeItem,
    propTree: PropTree
}

export function propTreeCallback(objm: ESObjectsManager, params: propTreeCallbackParamsType) {
    const {
        property,
        customEventName,
        otherParams,
    } = params;

    const { dragstartDataMananger } = objm;

    //TODO:将来各个类型的组件回调函数都可以自定义
    if (property instanceof PositionProperty) {
        if (customEventName === 'BindingPositionVisualEditing') {
        }
    } else if (property instanceof PositionsProperty) {
        if (customEventName === 'BindingPositionsVisualEditing') {
        }
    } else if (property instanceof StringProperty) {
        const [_0, setValue] = getReactFuncs(property.reactVar)
        if (customEventName === 'ondragover') {
            console.log('ondragover');
            if (!otherParams) throw new Error(`!otherParams`);
            const dragEvent = otherParams[0] as DragEvent;
            dragEvent.preventDefault();
            if (!dragEvent.dataTransfer) return;

            if (getSceneObjId(dragstartDataMananger)) {
                dragEvent.dataTransfer.dropEffect = 'move'
                // console.log('move');
            } else {
                dragEvent.dataTransfer.dropEffect = 'none'
                // console.log('none');
            }
        } else if (customEventName === 'ondrop') {
            if (!otherParams) throw new Error(`!otherParams`);
            const dragEvent = otherParams[0] as DragEvent;
            dragEvent.preventDefault();
            // console.log('ondrop 1');
            const id = getSceneObjId(dragstartDataMananger)
            if (id !== undefined) {
                // console.log('ondrop 2');
                setValue(id);
            }
        } else if (customEventName === 'ondragleave') {
            // do nothing
        }
    } else if (property instanceof StringsProperty) {
        const [_0, setValue] = getReactFuncs(property.reactVar)
        // setValue(sceneObject.id)

        if (customEventName === 'ondragover') {
            console.log('ondragover');
            if (!otherParams) throw new Error(`!otherParams`);
            const dragEvent = otherParams[0] as DragEvent;
            dragEvent.preventDefault();
            if (!dragEvent.dataTransfer) return;

            if (getSceneObjId(dragstartDataMananger)) {
                dragEvent.dataTransfer.dropEffect = 'move'
                // console.log('move');
            } else {
                dragEvent.dataTransfer.dropEffect = 'none'
                // console.log('none');
            }
        } else if (customEventName === 'ondrop') {
            if (!otherParams) throw new Error(`!otherParams`);
            const dragEvent = otherParams[0].$event as DragEvent;
            const dom = otherParams[0].strinsPropDom
            const index = otherParams[0].index
            dragEvent.preventDefault();
            // console.log('ondrop 1');
            const id = getSceneObjId(dragstartDataMananger)
            if (id !== undefined) {
                // console.log(dom[index].firstChild);
                dom[index].firstChild.value = id
                const event = new Event('input', {
                    bubbles: true,
                    cancelable: true
                });
                dom[index].firstChild.dispatchEvent(event);
            }
        } else if (customEventName === 'ondragleave') {
            // do nothing
        }
    } else if (property instanceof String2sProperty) {
        const [getValue, setValue] = getReactFuncs(property.reactVar)
        // if (customEventName === 'ondragover') {
        //     if (!otherParams) throw new Error(`!otherParams`);
        //     const dragEvent = otherParams[0] as DragEvent;
        //     dragEvent.preventDefault();
        //     if (!dragEvent.dataTransfer) return;
        //     if (getSceneObjId(dragstartDataMananger)) {
        //         dragEvent.dataTransfer.dropEffect = 'move'
        //     } else {
        //         dragEvent.dataTransfer.dropEffect = 'none'
        //     }
        // } else if (customEventName === 'ondrop') {
        //     if (!otherParams) throw new Error(`!otherParams`);
        //     const dragEvent = otherParams[0] as DragEvent;
        //     dragEvent.preventDefault();
        //     const id = getSceneObjId(dragstartDataMananger)
        //     if (id !== undefined) {
        //         const valArr = getValue() as [string, string][]
        //         const index = otherParams[1] as [number, number]
        //         valArr[index[0]][index[1]] = '' + id
        //         setValue(valArr)
        //         // console.log("String2sProperty", id, getValue())
        //     }
        // }
    }
};
