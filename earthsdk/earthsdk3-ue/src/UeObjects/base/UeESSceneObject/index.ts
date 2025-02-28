import { EngineObject, ESJsonObjectType, ESSceneObject } from "earthsdk3";
import { UeObjectPropValFuncType } from "./types";
import { ESUeViewer } from "../../../ESUeViewer";
import { createNextAnimateFrameEvent, Event, JsonValue } from "xbsj-base";
import { destroyCallFunc } from "../../../ESUeViewer/uemsg/CallUeFuncs";

export class UeESSceneObject<T extends ESSceneObject = ESSceneObject> extends EngineObject<T> {
    // null 表示不设置，undefined表示不做任何转换 
    static propValFuncs: { [k: string]: UeObjectPropValFuncType | undefined | null } = {
        ref: null,
        devTags: null,
        extras: null,
        execOnceFuncStr: null,
        updateFuncStr: null,
        toDestroyFuncStr: null,
    };

    static forceUeUpdateProps: string[] = [];

    //当combinationClass为true时，表示该类是组合类，不需要自动更新也不需要创建销毁，不用给ue发送这个对象的消息，都有组合类去处理
    static combinationClass: boolean = false;

    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) return;

        //////////////////////////////////////////////////////////////////////////
        // ES对象属性自动更新机制
        //@ts-ignore
        if (!this.constructor.combinationClass) {

            this.d(this.createdEvent.don(() => {
                // @ts-ignore
                const propValFuncs = this.constructor.propValFuncs as unknown as { [k: string]: UeObjectPropValFuncType | null | undefined };

                const dp = sceneObject.defaultProps as ESJsonObjectType;
                const propNames = Object.keys(dp).filter(e => (propValFuncs[e] !== null));
                // @ts-ignore
                propNames.push(...this.constructor.forceUeUpdateProps);

                // @ts-ignore
                const undefinedDefaults = (sceneObject.constructor.defaults as ESJsonObjectType);

                const newProps = { val: {} as ESJsonObjectType };
                const propChangeds: Event[] = [];

                for (let propName of propNames) {
                    const propChangedName = propName + 'Changed';
                    // @ts-ignore
                    const propChanged = sceneObject[propChangedName] as Event;
                    propChangeds.push(propChanged);

                    const vf = propValFuncs[propName];
                    if (vf === null) {
                        console.error(`vf === null error`);
                        throw new Error(`vf === null error`);
                    }

                    const update = () => {
                        // @ts-ignore
                        const rawPv = sceneObject[propName] ?? undefinedDefaults[propName];
                        let propValue = (vf ? vf(rawPv, this, ueViewer, sceneObject) : rawPv) as JsonValue;
                        if (propValue === undefined) {
                            console.warn(`UE自动更新的属性，不应该为undefined！ 属性名：${propName} 对象名：${sceneObject.name} 对象id: ${sceneObject.id}`);
                            return;
                        }
                        newProps.val[propName] = propValue;
                    }
                    update();
                    this.d(propChanged.don(update));
                }

                const ueUpdate = () => {
                    viewer.callUeFunc({
                        f: 'update',
                        p: {
                            id: sceneObject.id,
                            ...newProps.val,
                        }
                    });
                    newProps.val = {};
                };

                const updateEvent = this.dv(createNextAnimateFrameEvent(...propChangeds));
                this.d(updateEvent.don(ueUpdate));
                this.d(sceneObject.createdEvent.don(ueUpdate));
                this.d(sceneObject.flushEvent.don(() => updateEvent.flush()));
            }));
        }
        {
            /////////////////////////////////////////////////////////////////////
            // createdEvent的实现
            //@ts-ignore
            if (!this.constructor.combinationClass) {
                let created = false;
                this.d(() => {
                    if (created) destroyCallFunc(viewer, sceneObject.id)
                });

                viewer.callUeFunc({
                    f: 'create',
                    p: {
                        type: sceneObject.typeName,
                        id: sceneObject.id,
                    }
                }).then(() => {
                    created = true;
                    sceneObject.createdEvent.emit();
                }).catch(err => console.error(err));
            }
        }
    }
}
