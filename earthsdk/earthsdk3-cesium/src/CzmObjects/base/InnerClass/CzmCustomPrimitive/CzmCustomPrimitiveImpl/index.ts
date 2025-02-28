//@ts-nocheck
import * as Cesium from 'cesium';
import { CzmBasePrimitive } from './CzmBasePrimitive';
import { extendClassProps, ReactivePropsToNativePropsAndChanged, Event, Destroyable, ObjResettingWithEvent, getExtProp, setExtProp, react, SceneObjectKey, createGuid } from 'xbsj-base';
import { CzmAttributesType } from '../../../../../ESJTypesCzm';
function getComponentDataType(typedArray: Float32Array | Float64Array | Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array) {
    if (typedArray instanceof Float32Array) {
        return Cesium.ComponentDatatype.FLOAT;
    } else if (typedArray instanceof Int8Array) {
        return Cesium.ComponentDatatype.BYTE;
    } else if (typedArray instanceof Uint8Array) {
        return Cesium.ComponentDatatype.UNSIGNED_BYTE;
    } else if (typedArray instanceof Int16Array) {
        return Cesium.ComponentDatatype.SHORT;
    } else if (typedArray instanceof Uint16Array) {
        return Cesium.ComponentDatatype.UNSIGNED_SHORT;
    } else if (typedArray instanceof Int32Array) {
        return Cesium.ComponentDatatype.INT;
    } else if (typedArray instanceof Uint32Array) {
        return Cesium.ComponentDatatype.UNSIGNED_INT;
    } else if (typedArray instanceof Float64Array) {
        console.error(`暂不支持Float64Array`);
        throw new Error(`暂不支持Float64Array`);
    } else {
        console.error(`不支持的TypedArray！`);
        throw new Error(`不支持的TypedArray！`);
    }
}

function getIndexDataType(typedArray: Uint8Array | Uint16Array | Uint32Array) {
    if (typedArray instanceof Uint8Array) {
        return Cesium.IndexDatatype.UNSIGNED_BYTE;
    } else if (typedArray instanceof Uint16Array) {
        return Cesium.IndexDatatype.UNSIGNED_SHORT;
    } else if (typedArray instanceof Uint32Array) {
        return Cesium.IndexDatatype.UNSIGNED_INT;
    } else {
        console.error(`不支持的TypedArray！`);
        throw new Error(`不支持的TypedArray！`);
    }
}

type InnerAttributeType = {
    index: number;
    vertexBuffer: Cesium.Buffer;
    componentsPerAttribute: 1 | 2 | 3 | 4;
    normalize: boolean;
    componentDatatype: Cesium.ComponentDatatype;
};

function equalsAttributeLocations(left: Cesium.AttributeLocations, right: Cesium.AttributeLocations) {
    if (left === right) {
        return true;
    }
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
        return false;
    }
    if (leftKeys.some((e, i) => rightKeys[i] !== e)) {
        return false;
    }
    if (leftKeys.some((e, i) => left[e] !== right[e])) {
        return false;
    }
    return true;
}

function equalsInnerAttributeType(left: InnerAttributeType, right: InnerAttributeType) {
    if (left.componentDatatype !== right.componentDatatype) {
        return false;
    } else if (left.componentsPerAttribute !== right.componentsPerAttribute) {
        return false;
    } else if (left.index !== right.index) {
        return false;
    } else if (left.normalize !== right.normalize) {
        return false;
    } else if (left.vertexBuffer !== right.vertexBuffer) {
        return false;
    }
    return true;
}

function equalsAttributeType(left: AttributeType, right: AttributeType) {
    if (left === right) {
        return true;
    }
    if (left.usage !== right.usage) {
        return false;
    }
    if (left.componentsPerAttribute !== right.componentsPerAttribute) {
        return false;
    }
    if (left.normalize !== right.normalize) {
        return false;
    }
    if (left.typedArray === right.typedArray) {
        return true;
    }
    if (left.typedArray.byteLength !== right.typedArray.byteLength) {
        return false;
    }

    const rt = right.typedArray;
    if (left.typedArray.every((e, i) => e === rt[i])) {
        return true;
    } else {
        return false;
    }
}

export type BoundingVolumeType = Cesium.BoundingSphere | Cesium.BoundingRectangle | Cesium.OrientedBoundingBox;

export class CzmCustomPrimitiveImpl extends CzmBasePrimitive {
    private _updateEvent = this.disposeVar(new Event<[Cesium.FrameState]>());
    private _drawCommand?: Cesium.DrawCommand;
    get drawCommand() { return this._drawCommand; }

    private _ESSceneObjectID = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get ESSceneObjectID() { return this._ESSceneObjectID.value; }
    set ESSceneObjectID(value: SceneObjectKey) { this._ESSceneObjectID.value = value; }
    get ESSceneObjectIDChanged() { return this._ESSceneObjectID.changed; }

    constructor(private _scene: Cesium.Scene, id?: string) {
        super();
        id && (this.ESSceneObjectID = id);
        const scene = this._scene;
        const { context } = scene;

        let attributeDirty = false;
        let indexDirty = false;
        let vertexArrayDirty = false;
        let shaderProgramDirty = false;
        let drawCommandDirty = false;

        let pickId: Destroyable | undefined;
        let attributeLocations: Cesium.AttributeLocations | undefined = undefined;
        let attributeBuffers: { [k: string]: Cesium.Buffer; } | undefined = undefined;
        let innerAttributes: InnerAttributeType[] | undefined = undefined;
        let indexBuffer: Cesium.IndexBuffer | undefined;
        let vertexArray: Cesium.VertexArray | undefined;
        let shaderProgram: Cesium.ShaderProgram | undefined;
        let drawCommand: Cesium.DrawCommand | undefined;

        this.dispose(() => {
            if (pickId) {
                pickId.destroy();
                pickId = undefined;
            }
            if (indexBuffer) {
                indexBuffer.destroy();
                indexBuffer = undefined;
            }
            if (shaderProgram) {
                shaderProgram.destroy();
                shaderProgram = undefined;
            }
            if (vertexArray) {
                vertexArray.destroy();
                vertexArray = undefined;
            }
            if (drawCommand) {
                // drawCommand没有destroy
                drawCommand = undefined;
                this._drawCommand = drawCommand;
            }
        });

        this.dispose(this.passChanged.disposableOn(() => drawCommand && (drawCommand.pass = this.pass)));
        this.dispose(this.attributesChanged.disposableOn(() => attributeDirty = true));
        this.dispose(this.uniformMapChanged.disposableOn(() => drawCommand && (drawCommand.uniformMap = this.uniformMap)));
        this.dispose(this.modelMatrixChanged.disposableOn(() => drawCommand && (drawCommand.modelMatrix = this.modelMatrix)));
        // vtxf 20230909
        // 本来renderState直接设置就好，但是Cesium有一个bug，就是当透明pass下的drawCommand先创建好以后，renderState修改就无效了
        // 原因是 renderState设置不会触发oit的transluentCommand重建，其他的renderState还会使用以前的
        // 为了解决这个问题，这里不改Cesium代码，直接驱动重建一个新的drawCommand，从而迫使derivedCommand能更新到最新的renderState
        // Cesium的derivedCommand机制还是太差劲
        // this.dispose(this.renderStateChanged.disposableOn(() => drawCommand && (drawCommand.renderState = Cesium.RenderState.fromCache(this.renderState))));
        this.dispose(this.renderStateChanged.disposableOn(() => {
            if (!drawCommand) return;
            drawCommand = undefined; // 直接设置成undefeind，这样drawCommand就会重建，重建的时候会获取renderState设置
            // drawCommand.renderState = Cesium.RenderState.fromCache(this.renderState)
            drawCommandDirty = true;
        }));
        this.dispose(this.primitiveTypeChanged.disposableOn(() => drawCommand && (drawCommand.primitiveType = this.primitiveType)));
        this.dispose(this.indexTypedArrayChanged.disposableOn(() => indexDirty = true));
        this.dispose(this.vertexShaderSourceChanged.disposableOn(() => shaderProgramDirty = true));
        this.dispose(this.fragmentShaderSourceChanged.disposableOn(() => shaderProgramDirty = true));

        this.dispose(this.occludeChanged.disposableOn(() => drawCommand && (drawCommand.occlude = this.occlude)));
        this.dispose(this.countChanged.disposableOn(() => drawCommand && (drawCommand.count = this.count)));
        this.dispose(this.offsetChanged.disposableOn(() => drawCommand && (drawCommand.offset = this.offset)));
        this.dispose(this.instanceCountChanged.disposableOn(() => drawCommand && (drawCommand.instanceCount = this.instanceCount)));
        this.dispose(this.castShadowsChanged.disposableOn(() => drawCommand && (drawCommand.castShadows = this.castShadows)));
        this.dispose(this.receiveShadowsChanged.disposableOn(() => drawCommand && (drawCommand.receiveShadows = this.receiveShadows)));
        this.dispose(this.executeInClosestFrustumChanged.disposableOn(() => drawCommand && (drawCommand.executeInClosestFrustum = this.executeInClosestFrustum)));
        this.dispose(this.debugShowBoundingVolumeChanged.disposableOn(() => drawCommand && (drawCommand.debugShowBoundingVolume = this.debugShowBoundingVolume)));
        this.dispose(this.debugOverlappingFrustumsChanged.disposableOn(() => drawCommand && (drawCommand.debugOverlappingFrustums = this.debugOverlappingFrustums)));
        // this.dispose(this.pickIdChanged.disposableOn(() => drawCommand && (drawCommand.pickId = this.pickId)));
        this.dispose(this.pickOnlyChanged.disposableOn(() => drawCommand && (drawCommand.pickOnly = this.pickOnly)));
        this.dispose(this.depthForTranslucentClassificationChanged.disposableOn(() => drawCommand && (drawCommand.depthForTranslucentClassification = this.depthForTranslucentClassification)));

        const updateCull = () => {
            if (drawCommand) {
                if (!drawCommand.boundingVolume) {
                    drawCommand.cull = false;
                } else {
                    drawCommand.cull = this.cull ?? true;
                }
            }
        };
        updateCull();
        this.dispose(this.cullChanged.disposableOn(updateCull));

        this.dispose(this.boundingVolumeChanged.disposableOn(() => {
            if (drawCommand) {
                drawCommand.boundingVolume = this.boundingVolume;
            }
            updateCull();
        }));

        const pickIdResetting = this.disposeVar(new ObjResettingWithEvent(this.allowPickingChanged, () => {
            // @ts-ignore
            return context.createPickId({ primitive: this });
        }));

        this.dispose(this.allowPickingChanged.disposableOn(() => {
            // xbsjPickColor220823
            shaderProgramDirty = true;
            if (drawCommand) {
                drawCommand.pickId = this.allowPicking ? `xbsjPickColor220823` : undefined;
            }
        }));

        const update = (frameState: Cesium.FrameState) => {
            const { attributes, indexTypedArray } = this;

            if (attributeDirty && attributes) {
                attributeDirty = false;

                const tempAttributeLocations: Cesium.AttributeLocations = {};
                const tempAttributeBuffers: { [k: string]: Cesium.Buffer; } = {};
                const tempInnerAttributes: InnerAttributeType[] = [];

                let i = 0;
                for (let [attributeName, attribute] of Object.entries(attributes)) {
                    const index = i++;
                    const { typedArray, componentsPerAttribute, usage = Cesium.BufferUsage.STATIC_DRAW, normalize = false } = attribute;

                    if (!typedArray) {
                        console.warn(`CzmCustomPrimitive attribute[${attributeName}] typedeArray is undefined!`);
                        continue;
                    }

                    tempAttributeLocations[attributeName] = index;

                    let vertexBuffer!: Cesium.Buffer;
                    do {
                        if (attributeBuffers && attributeBuffers[attributeName]) {
                            const originAttribute = getExtProp<AttributeType>(attributeBuffers[attributeName], '_originAttribute');
                            // if (originAttribute === attribute) {
                            if (originAttribute && equalsAttributeType(originAttribute, attribute)) {
                                // 直接拿来用
                                vertexBuffer = attributeBuffers[attributeName];
                                delete attributeBuffers[attributeName];
                                tempAttributeBuffers[attributeName] = vertexBuffer;
                                break;
                            } else if (originAttribute &&
                                originAttribute.typedArray !== attribute.typedArray &&
                                originAttribute.typedArray.byteLength === attribute.typedArray.byteLength &&
                                originAttribute.usage === attribute.usage
                            ) {
                                // 替换原buffer
                                vertexBuffer = attributeBuffers[attributeName];
                                vertexBuffer.copyFromArrayView(attribute.typedArray);
                                delete attributeBuffers[attributeName];
                                tempAttributeBuffers[attributeName] = vertexBuffer;
                                setExtProp<AttributeType>(tempAttributeBuffers[attributeName], '_originAttribute', attribute);
                                break;
                            }
                        }

                        // 创建新buffer
                        vertexBuffer = Cesium.Buffer.createVertexBuffer({ context, typedArray, usage });
                        // @ts-ignore 防止VertexArray在destroy时自动删除了Buffer
                        vertexBuffer.vertexArrayDestroyable = false;
                        tempAttributeBuffers[attributeName] = vertexBuffer;
                        setExtProp<AttributeType>(tempAttributeBuffers[attributeName], '_originAttribute', attribute);
                    } while (false);

                    tempInnerAttributes.push({
                        index,
                        vertexBuffer,
                        componentsPerAttribute,
                        normalize,
                        componentDatatype: getComponentDataType(typedArray),
                    });
                }

                if (attributeBuffers) {
                    for (let buffer of Object.values(attributeBuffers)) {
                        buffer.destroy();
                    }
                }

                do {
                    if (!innerAttributes || innerAttributes.length !== tempInnerAttributes.length) {
                        vertexArrayDirty = true;
                        break;
                    }
                    if (innerAttributes.some((e, i) => !equalsInnerAttributeType(e, tempInnerAttributes[i]))) {
                        vertexArrayDirty = true;
                        break;
                    }
                } while (false);

                attributeBuffers = tempAttributeBuffers;
                innerAttributes = tempInnerAttributes;

                // vertexArrayDirty在两种情况下置为true：
                // 1 创建了新的vertexBuffer
                // 2 原始buffer销毁了
                // 3 normalize componentsPerAttribute 设置得不相等

                if (tempAttributeLocations) {
                    if (!attributeLocations || !equalsAttributeLocations(tempAttributeLocations, attributeLocations)) {
                        attributeLocations = tempAttributeLocations;
                        shaderProgramDirty = true;
                        vertexArrayDirty = true;
                    }
                }
            }

            if (indexDirty) {
                indexDirty = false;

                if (indexBuffer) {
                    indexBuffer.destroy();
                    indexBuffer = undefined;
                }

                indexBuffer = indexTypedArray ? Cesium.Buffer.createIndexBuffer({
                    context,
                    typedArray: indexTypedArray,
                    usage: Cesium.BufferUsage.STATIC_DRAW,
                    indexDatatype: getIndexDataType(indexTypedArray)
                }) : undefined;

                if (indexBuffer) { // 修复index设置后取消导致的崩溃 vtxf 20230909
                    // @ts-ignore 防止VertexArray在destroy时自动删除了Buffer
                    indexBuffer.vertexArrayDestroyable = false;
                }
                vertexArrayDirty = true;
            }

            if (vertexArrayDirty) {
                vertexArrayDirty = false;

                if (vertexArray) {
                    vertexArray.destroy();
                    vertexArray = undefined;
                }

                if (innerAttributes && attributeLocations) {
                    vertexArray = new Cesium.VertexArray({
                        context,
                        attributes: innerAttributes,
                        attributeLocations,
                        bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
                        indexBuffer,
                    });

                    if (drawCommand) {
                        drawCommand.vertexArray = vertexArray;
                    } else {
                        drawCommandDirty = true;
                    }
                }
            }

            if (shaderProgramDirty) {
                shaderProgramDirty = false;

                //TODO:AXEJ不知道为什么，移植过来就报错，先注释用着
                // if (shaderProgram) {
                //     shaderProgram.destroy();
                //     shaderProgram = undefined;
                // }

                const pickId = pickIdResetting.obj as { color: Cesium.Color } | undefined;
                let pickColorShaderSource: string;
                if (pickId) {
                    const { red, green, blue, alpha } = pickId.color;
                    const pickIdColor = `vec4(${red.toFixed(6)}, ${green.toFixed(6)}, ${blue.toFixed(6)}, ${alpha.toFixed(6)})`;
                    pickColorShaderSource = `const vec4 xbsjPickColor220823 = ${pickIdColor}; \n`;
                } else {
                    pickColorShaderSource = '';
                }

                if (attributeLocations) {
                    shaderProgram = Cesium.ShaderProgram.fromCache({
                        context,
                        vertexShaderSource: new Cesium.ShaderSource({
                            sources: [this.vertexShaderSource],
                            // defines: this.vertexShaderDefines,
                        }),
                        fragmentShaderSource: new Cesium.ShaderSource({
                            sources: [pickColorShaderSource, this.fragmentShaderSource],
                            // defines: fragmentSahderDefines,
                        }),
                        attributeLocations,
                    });
                    if (drawCommand) {
                        drawCommand.shaderProgram = shaderProgram;
                    } else {
                        drawCommandDirty = true;
                    }
                }
            }

            if (drawCommandDirty) {
                drawCommandDirty = false;

                if (!drawCommand) {
                    if (vertexArray && shaderProgram) {
                        // @ts-ignore 类型对不上 以后得看下是否需要修改 vtxf 20231115
                        drawCommand = new Cesium.DrawCommand({
                            vertexArray,
                            primitiveType: this.primitiveType,
                            //@ts-ignore
                            renderState: Cesium.RenderState.fromCache(this.renderState),
                            shaderProgram,
                            owner: this,
                            uniformMap: this.uniformMap,
                            // framebuffer : framebuffer,
                            pass: this.pass,
                            modelMatrix: this.modelMatrix,
                            boundingVolume: this.boundingVolume,
                            cull: this.cull,
                            occlude: this.occlude,
                            count: this.count,
                            offset: this.offset,
                            instanceCount: this.instanceCount,
                            castShadows: this.castShadows,
                            receiveShadows: this.receiveShadows,
                            // pickId: this.pickId,
                            pickId: this.allowPicking ? `xbsjPickColor220823` : undefined,
                            pickOnly: this.pickOnly,
                            debugShowBoundingVolume: this.debugShowBoundingVolume,
                            // debugOverlappingFrustums: this.debugOverlappingFrustums,
                            depthForTranslucentClassification: this.depthForTranslucentClassification,
                        });
                        this._drawCommand = drawCommand;
                        drawCommand.debugOverlappingFrustums = this.debugOverlappingFrustums;
                        drawCommand.executeInClosestFrustum = this.executeInClosestFrustum;
                    }
                }
            }

            if (drawCommand) {
                frameState.commandList.push(drawCommand);
            }
        };

        this.dispose(this._updateEvent.disposableOn(update));
    }
    //@ts-ignore
    update(frameState: Cesium.FrameState) {
        if (!this.show) {
            return;
        }

        this._updateEvent.emit(frameState);
    }
}

export namespace CzmCustomPrimitiveImpl {
    export const createDefaultProps = () => ({
        modelMatrix: react(new Cesium.Matrix4(), Cesium.Matrix4.equals, Cesium.Matrix4.clone),
        boundingVolume: undefined as BoundingVolumeType | undefined,
        //@ts-ignore
        pass: Cesium.Pass.OPAQUE as Cesium.Pass,
        attributes: {} as CzmAttributesType,
        cull: true,
        occlude: true,
        count: undefined as number | undefined,
        offset: 0,
        indexTypedArray: undefined as IndexType | undefined,
        instanceCount: 0,
        vertexShaderSource: '',
        fragmentShaderSource: '',
        castShadows: false,
        receiveShadows: false,
        //@ts-ignore
        uniformMap: {} as Cesium.UniformMap,
        // framebuffer
        //@ts-ignore
        renderState: {} as Cesium.RenderStateOptions,
        primitiveType: Cesium.PrimitiveType.TRIANGLES as Cesium.PrimitiveType,
        executeInClosestFrustum: false,
        owner: undefined as Object | undefined,
        debugShowBoundingVolume: false,
        debugOverlappingFrustums: 0,
        // pickId: undefined as string | undefined,
        allowPicking: undefined as boolean | undefined,
        pickOnly: false,
        depthForTranslucentClassification: false,
    });
}
extendClassProps(CzmCustomPrimitiveImpl.prototype, CzmCustomPrimitiveImpl.createDefaultProps);
export interface CzmCustomPrimitiveImpl extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmCustomPrimitiveImpl.createDefaultProps>> { }
