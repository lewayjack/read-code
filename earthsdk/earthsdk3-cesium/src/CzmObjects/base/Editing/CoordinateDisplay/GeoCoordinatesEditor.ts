import * as Cesium from 'cesium';
import { geoRhumbDestination, geoRhumbDistance, geoRhumbHeading } from "earthsdk3";
import { CzmPolylines, GeoCoordinates } from '../../../../CzmObjects';
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { computePickingInfoWithCoordinates, CoordinatesComputingPickingInfo, fromCartographic, geoNeareastPointOnRhumbLine, getSceneScaleForScreenPixelSize, pickHeightPosition, pickVirtualEarth, positionFromCartesian, positionToCartesian, toCartesian } from "../../../../utils";
import { Destroyable, Listener, Event, extendClassProps, ReactivePropsToNativePropsAndChanged, reactArrayWithUndefined, ReactiveVariable, reactArray, react, createNextAnimateFrameEvent, Processing, getDomEventCurrentTargetPos, createProcessingFromAsyncFunc, step } from "xbsj-base";

type OpInfoType = {
    step: ReactiveVariable<number>,
    constraintMode: ReactiveVariable<CoordinatesComputingPickingInfo['constraintMode']>;
    originPosition: ReactiveVariable<[number, number, number]>;
    originHeading: ReactiveVariable<number>;
    originDimensions: ReactiveVariable<[number, number, number]>;
    draggingStartPosition: ReactiveVariable<[number, number, number]>;
    movingPosition: ReactiveVariable<[number, number, number]>;
    destinationPosition: ReactiveVariable<[number, number, number]>;
    destinationHeading: ReactiveVariable<number>,
    moved: ReactiveVariable<boolean>,
}

export class GeoCoordinatesEditor extends Destroyable {

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        position: [116.39, 39.9, 0] as [number, number, number], // 经度纬度高度，度为单位
    };

    private _opInfo: OpInfoType = {
        step: this.disposeVar(react(0)),
        constraintMode: this.disposeVar(react<CoordinatesComputingPickingInfo['constraintMode']>('none')),
        originPosition: this.disposeVar(reactArray<[number, number, number]>([0, 0, 0])),
        originHeading: this.disposeVar(react(0)),
        originDimensions: this.disposeVar(reactArray<[number, number, number]>([1, 1, 1])),
        draggingStartPosition: this.disposeVar(reactArray<[number, number, number]>([0, 0, 0])),
        movingPosition: this.disposeVar(reactArray<[number, number, number]>([0, 0, 0])),
        destinationPosition: this.disposeVar(reactArray<[number, number, number]>([0, 0, 0])),
        destinationHeading: this.disposeVar(react(0)),
        moved: this.disposeVar(react<boolean>(false)),
    };

    constructor(czmViewer: ESCesiumViewer) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const { scene } = viewer;

        const dimensions = this.ad(reactArray<[number, number, number]>([1, 1, 1]));
        {
            // 根据相机视角控制坐标轴的缩放
            const centerCartesian = new Cesium.Cartesian3();
            const updateCenter = () => {
                const { position = GeoCoordinatesEditor.defaults.position } = this;
                const tempPos = [...position] as [number, number, number];
                czmViewer.editingHeightOffset && (tempPos[2] -= czmViewer.editingHeightOffset);
                Cesium.Cartesian3.fromDegrees(...tempPos, undefined, centerCartesian);
            }
            updateCenter();
            this.dispose(this.positionChanged.disposableOn(updateCenter));

            this.dispose(scene.preUpdate.addEventListener(() => {
                const scale = getSceneScaleForScreenPixelSize(scene, centerCartesian, this.axisPixelSize);
                if (scale !== undefined) {
                    dimensions.value = [scale, scale, scale];
                } else {
                    console.warn(`CzmGeoCoordinatesEditor warn: scale: ${scale ?? 'undefined'}`);
                }
            }));
        }
        {
            const updateMoved = () => {
                if (this._opInfo.constraintMode.value === 'none') {
                    this._opInfo.moved.value = false;
                    return;
                }
                if (this._opInfo.originHeading.value !== this._opInfo.destinationHeading.value) {
                    this._opInfo.moved.value = true;
                    return;
                }
                if (!this._opInfo.originPosition.value.every((e, i) => e === this._opInfo.destinationPosition.value[i])) {
                    this._opInfo.moved.value = true;
                    return;
                }
            };
            updateMoved();
            this.dispose(this._opInfo.originHeading.changed.disposableOn(updateMoved));
            this.dispose(this._opInfo.originPosition.changed.disposableOn(updateMoved));
            this.dispose(this._opInfo.destinationHeading.changed.disposableOn(updateMoved));
            this.dispose(this._opInfo.destinationPosition.changed.disposableOn(updateMoved));
        }
        // 初始化绘制
        const mainCoordinates = this._createMainCoordinates(czmViewer, this, scene);
        this.dispose(this.flyToEvent.disposableOn(duration => czmViewer.actived && mainCoordinates.flyTo(duration)));
        const updateColor = () => setCoordinatesColor(mainCoordinates, this._opInfo.constraintMode.value, this._opInfo.step.value === 0);
        updateColor();
        this.dispose(this._opInfo.constraintMode.changed.disposableOn(updateColor));
        this.dispose(this._opInfo.step.changed.disposableOn(updateColor));

        this._createOriginCoordinates(czmViewer);
        this._createGrid(czmViewer);
        this._createHelpLines(czmViewer);
        this._createCircle(czmViewer);
        {
            const updatePosition = () => {
                if (this._opInfo.moved) {
                    const tempPos = [...this._opInfo.destinationPosition.value] as [number, number, number];
                    czmViewer.editingHeightOffset && (tempPos[2] += czmViewer.editingHeightOffset);
                    this.position = tempPos;
                }
            }
            // updatePosition();
            this.dispose(this._opInfo.destinationPosition.changed.disposableOn(updatePosition));
            const updateHeading = () => this._opInfo.moved && (this.heading = this._opInfo.destinationHeading.value);
            // updateHeading();
            this.dispose(this._opInfo.destinationHeading.changed.disposableOn(updateHeading));
        }
        const pickingXYProcessing = this.disposeVar(new Processing<void, [inverseHeading: number, inverseDistance: number]>((
            _,
            inverseHeading,
            inverseDistance
        ) => {
            const movingPosition: [number, number, number] = [0, 0, 0];
            const movingCartographic = new Cesium.Cartographic();

            return czmViewer.pointerMoveEvent.disposableOn(pointerEvent => {
                if (!pointerEvent.pointerEvent) return
                const screenPosition = toCartesian(getDomEventCurrentTargetPos(pointerEvent.pointerEvent));
                if (!pickVirtualEarth(scene, screenPosition, this._opInfo.originPosition.value[2], movingCartographic)) {
                    return;
                }
                fromCartographic(movingCartographic, movingPosition);

                if (this._opInfo.constraintMode.value === 'x') {
                    geoNeareastPointOnRhumbLine(this._opInfo.originPosition.value, this._opInfo.originHeading.value + 90, movingPosition, movingPosition);
                } else if (this._opInfo.constraintMode.value === 'y') {
                    geoNeareastPointOnRhumbLine(this._opInfo.originPosition.value, this._opInfo.originHeading.value, movingPosition, movingPosition);
                } else if (this._opInfo.constraintMode.value === 'xy') {
                } else {
                    console.warn(`should not be here!`);
                }
                this._opInfo.movingPosition.value = movingPosition;

                const stopPosition: [number, number, number] = [0, 0, 0];
                geoRhumbDestination(movingPosition, inverseDistance, inverseHeading, stopPosition);
                this._opInfo.destinationPosition.value = stopPosition;
            });
        }));

        const pickingZProcessing = this.disposeVar(new Processing(() => {
            const movingCartesian = new Cesium.Cartesian3();
            const movingPosition: [number, number, number] = [0, 0, 0];

            return czmViewer.pointerMoveEvent.disposableOn(pointerEvent => {
                if (!pointerEvent.pointerEvent) return
                const screenPosition = toCartesian(getDomEventCurrentTargetPos(pointerEvent.pointerEvent));
                if (!pickHeightPosition(scene, positionToCartesian(this._opInfo.originPosition.value), screenPosition, movingCartesian)) {
                    return;
                }
                const diffHeight = this._opInfo.originPosition.value[2] - this._opInfo.draggingStartPosition.value[2];
                if (positionFromCartesian(movingCartesian, movingPosition)) {
                    this._opInfo.movingPosition.value = movingPosition;
                    const op = this._opInfo.originPosition.value;
                    this._opInfo.destinationPosition.value = [op[0], op[1], movingPosition[2] + diffHeight];
                }
            });
        }));

        const pickingZAxisProcessing = this.disposeVar(new Processing(() => {
            const movingPosition: [number, number, number] = [0, 0, 0];
            const movingCartographic = new Cesium.Cartographic();

            return czmViewer.pointerMoveEvent.disposableOn(pointerEvent => {
                if (!pointerEvent.pointerEvent) return
                const screenPosition = toCartesian(getDomEventCurrentTargetPos(pointerEvent.pointerEvent));
                if (!pickVirtualEarth(scene, screenPosition, this._opInfo.originPosition.value[2], movingCartographic)) {
                    return;
                }
                fromCartographic(movingCartographic, movingPosition);

                const startAngle = geoRhumbHeading(this._opInfo.originPosition.value, this._opInfo.draggingStartPosition.value);
                const stopAngle = geoRhumbHeading(this._opInfo.originPosition.value, movingPosition);
                const diffAngle = stopAngle - startAngle;
                let destAngle = this._opInfo.originHeading.value + diffAngle;
                destAngle = Cesium.Math.toDegrees(Cesium.Math.negativePiToPi(Cesium.Math.toRadians(destAngle)));

                this.heading = destAngle;

                this._opInfo.movingPosition.value = movingPosition;
                this._opInfo.destinationHeading.value = destAngle;
            });
        }));


        const mainProcessing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
            do {
                this._opInfo.step.value = 0;
                this._opInfo.constraintMode.value = 'none';
                cancelsManager.disposer.dispose(() => {
                    this._opInfo.constraintMode.value = 'none';
                });

                // 1 获取限制轴信息，鼠标按下时进入下一步
                await step(cancelsManager, async cancelsManager => {
                    const updatePosition = () => {
                        const tempPos = [...(this.position ?? GeoCoordinatesEditor.defaults.position)] as [number, number, number];
                        czmViewer.editingHeightOffset && (tempPos[2] -= czmViewer.editingHeightOffset);
                        this._opInfo.destinationPosition.value = this._opInfo.originPosition.value = tempPos;
                    };
                    const updateHeading = () => (this._opInfo.originHeading.value = this._opInfo.destinationHeading.value = this.heading);
                    const updateDimensions = () => this._opInfo.originDimensions.value = dimensions.value;
                    cancelsManager.disposer.dispose((updatePosition(), this.positionChanged.disposableOn(updatePosition)));
                    cancelsManager.disposer.dispose((updateHeading(), this.headingChanged.disposableOn(updateHeading)));
                    cancelsManager.disposer.dispose((updateDimensions(), dimensions.changed.disposableOn(updateDimensions)));

                    const pickingInfo: CoordinatesComputingPickingInfo = {
                        constraintMode: 'none',
                        startDragPos: [0, 0, 0],
                    };
                    const updatePickingInfo = (pointerEvent: MouseEvent) => {
                        const ci = {
                            position: mainCoordinates.position ?? GeoCoordinates.defaults.position,
                            dimensions: mainCoordinates.dimensions ?? GeoCoordinates.defaults.dimensions,
                            heading: mainCoordinates.heading ?? GeoCoordinates.defaults.heading,
                        };
                        computePickingInfoWithCoordinates(
                            pointerEvent,
                            scene,
                            ci,
                            this.axisSnapPixelSize,
                            pickingInfo,
                            {
                                x: this.disableX,
                                y: this.disableY,
                                z: this.disableZ,
                                xy: this.disableXY,
                                zAxis: this.disableZAxis,
                            },
                        );
                        this._opInfo.constraintMode.value = pickingInfo.constraintMode;
                        this._opInfo.draggingStartPosition.value = pickingInfo.startDragPos;
                        this._opInfo.movingPosition.value = this._opInfo.draggingStartPosition.value;
                    }
                    cancelsManager.disposer.dispose(czmViewer.pointerMoveEvent.disposableOn((pointerEvent) => {
                        if (!pointerEvent.pointerEvent) return;
                        updatePickingInfo(pointerEvent.pointerEvent)
                    }));
                    await step(cancelsManager, cancelsManager => {
                        return new Promise<void>((resolve, reject) => {
                            cancelsManager.disposer.dispose(reject);
                            cancelsManager.disposer.dispose(czmViewer.pointerDownEvent.disposableOn(pointerEvent => {
                                if (pointerEvent.pointerEvent?.button !== 0) {
                                    return;
                                }
                                updatePickingInfo(pointerEvent.pointerEvent);
                                if (pickingInfo.constraintMode !== 'none') {
                                    resolve();
                                }
                            }));
                        });
                    });
                });

                // 2 移动坐标轴过程中
                this._opInfo.step.value = 1;
                await step(cancelsManager, async cancelsManager => {
                    {
                        // scene.screenSpaceCameraController.enableInputs = false;
                        // cancelsManager.disposer.dispose(() => {
                        //     scene.screenSpaceCameraController.enableInputs = true;
                        // });
                        czmViewer.incrementDisabledInputStack();
                        cancelsManager.disposer.dispose(() => czmViewer.decrementDisabledInputStack());
                    }

                    if (['xy', 'x', 'y'].includes(this._opInfo.constraintMode.value)) {
                        const inverseHeading = geoRhumbHeading(this._opInfo.draggingStartPosition.value, this._opInfo.originPosition.value);
                        const inverseDistance = geoRhumbDistance(this._opInfo.draggingStartPosition.value, this._opInfo.originPosition.value);
                        pickingXYProcessing.restart(undefined, inverseHeading, inverseDistance);
                        cancelsManager.disposer.dispose(() => pickingXYProcessing.cancel());
                    } else if (this._opInfo.constraintMode.value === 'z') {
                        pickingZProcessing.restart();
                        cancelsManager.disposer.dispose(() => pickingZProcessing.cancel());
                    } else if (this._opInfo.constraintMode.value === 'zAxis') {
                        pickingZAxisProcessing.restart();
                        cancelsManager.disposer.dispose(() => pickingZAxisProcessing.cancel());
                    } else {
                        console.warn(`pickingInfo.constraintMode error! ${this._opInfo.constraintMode.value}`);
                    }

                    await step(cancelsManager, cancelsManager => {
                        return new Promise<void>((resolve, reject) => {
                            cancelsManager.disposer.dispose(reject);
                            cancelsManager.disposer.dispose(czmViewer.pointerUpEvent.disposableOn(() => {
                                resolve();
                            }));
                            cancelsManager.disposer.dispose(czmViewer.pointerOutEvent.disposableOn(() => {
                                resolve();
                            }));
                        })
                    });
                });
            } while (true);
        }));

        const updateMainProcessing = () => {
            if (this.enabled) {
                mainProcessing.restart();
            } else {
                mainProcessing.isRunning && mainProcessing.cancel();
            }
        }
        updateMainProcessing();
        this.dispose(this.enabledChanged.disposableOn(updateMainProcessing));
    }
    private _createMainCoordinates(czmViewer: ESCesiumViewer, coordinatesEditor: GeoCoordinatesEditor, scene: Cesium.Scene) {
        const coordinates = this.disposeVar(new GeoCoordinates(czmViewer));

        coordinates.show = true;

        {
            // 根据相机视角控制坐标轴的缩放
            const centerCartesian = new Cesium.Cartesian3();
            const updateProp = () => {
                const { position = GeoCoordinatesEditor.defaults.position } = coordinatesEditor;
                const tempPos = [...position] as [number, number, number];
                czmViewer.editingHeightOffset && (tempPos[2] -= czmViewer.editingHeightOffset);
                Cesium.Cartesian3.fromDegrees(...tempPos, undefined, centerCartesian);
                coordinates.position = tempPos;
            };
            updateProp();
            this.dispose(coordinatesEditor.positionChanged.disposableOn(updateProp));
            this.dispose(scene.preUpdate.addEventListener(() => {
                const scale = getSceneScaleForScreenPixelSize(scene, centerCartesian, coordinatesEditor.axisPixelSize);

                if (scale !== undefined) {
                    coordinates.dimensions = [scale, scale, scale];
                } else {
                    console.warn(`CzmGeoCoordinatesEditor warn: scale: ${scale ?? 'undefined'}`);
                }
            }));
        }

        {
            const updateProp = () => {
                coordinates.show = (coordinatesEditor.enabled ?? false) && coordinatesEditor.showCoordinates;
            };
            updateProp();
            this.dispose(coordinatesEditor.enabledChanged.disposableOn(updateProp));
            this.dispose(coordinatesEditor.showCoordinatesChanged.disposableOn(updateProp));
        }
        {
            const updateProp = () => {
                coordinates.heading = coordinatesEditor.heading ?? 0;
            };
            updateProp();
            this.dispose(coordinatesEditor.headingChanged.disposableOn(updateProp));
        }
        return coordinates;
    }
    private _createOriginCoordinates(
        czmViewer: ESCesiumViewer,
    ) {
        const originCoordinates = this.disposeVar(new GeoCoordinates(czmViewer));
        originCoordinates.xAxisColor = [1, 0, 0, 0.5];
        originCoordinates.yAxisColor = [0, 1, 0, 0.5];
        originCoordinates.zAxisColor = [0, 0, 1, 0.5];

        const {
            originPosition,
            originHeading,
            originDimensions,
        } = this._opInfo;

        const updateShow = () => {
            originCoordinates.show = this._opInfo.moved.value && this.showCoordinates
        }
        updateShow();
        this.dispose(this._opInfo.moved.changed.disposableOn(updateShow));

        const updatePosition = () => originCoordinates.position = originPosition.value;
        updatePosition();
        this.dispose(originPosition.changed.disposableOn(updatePosition));

        const updateDimensions = () => originCoordinates.dimensions = originDimensions.value;
        updateDimensions();
        this.dispose(originDimensions.changed.disposableOn(updateDimensions));

        const updateHeading = () => originCoordinates.heading = originHeading.value;
        updateHeading();
        this.dispose(originHeading.changed.disposableOn(updateHeading));

        return originCoordinates;
    }
    private _createGrid(czmViewer: ESCesiumViewer) {
        const geoGrid = this.disposeVar(new CzmPolylines(czmViewer));
        geoGrid.color = [1, 1, 0, 0.3];
        {
            const update = () => {
                geoGrid.color = this._opInfo.constraintMode.value !== 'none' ? [1, 1, 0, .6] : [1, 1, 0, .3];
            }
            update();
            this.dispose(this._opInfo.constraintMode.changed.disposableOn(update));
        }
        {
            const update = () => {
                geoGrid.show = this.enabled && this.showCircle;
            };
            update();
            this.dispose(this.enabledChanged.disposableOn(update));
            this.dispose(this.showCircleChanged.disposableOn(update));
        }

        const geoGridNextFrame = this.disposeVar(createNextAnimateFrameEvent(this._opInfo.originPosition.changed, this._opInfo.originHeading.changed, this._opInfo.originDimensions.changed));

        const updatePosition = () => {
            const p = this._opInfo.originPosition.value;
            const h = this._opInfo.originHeading.value;
            const d = this._opInfo.originDimensions.value[0];

            const positionsSet: [number, number, number][][] = [];
            for (let i = -4; i < 5; ++i) {
                const c = geoRhumbDestination(p, d * 0.2 * i, h + 90);
                if (c) {
                    const c0 = geoRhumbDestination(c, d, h + 180);
                    const c1 = geoRhumbDestination(c, d, h);
                    c0 && c1 && positionsSet.push([c0, c, c1]);
                }
            }
            for (let i = -4; i < 5; ++i) {
                const c = geoRhumbDestination(p, d * 0.2 * i, h);
                if (c) {
                    const c0 = geoRhumbDestination(c, d, h - 90);
                    const c1 = geoRhumbDestination(c, d, h + 90);
                    c0 && c1 && positionsSet.push([c0, c, c1]);
                }
            }

            geoGrid.positions = positionsSet;
        };
        updatePosition();
        this.dispose(geoGridNextFrame.disposableOn(updatePosition));

        return geoGrid;
    }

    private _createHelpLines(czmViewer: ESCesiumViewer) {
        const lines = this.disposeVar(new CzmPolylines(czmViewer));
        lines.arcType = 'RHUMB';
        lines.color = [1, 1, 0, 0.99];
        lines.hasDash = true;

        const updateLines = () => {
            lines.positions = [[this._opInfo.originPosition.value, this._opInfo.destinationPosition.value]]
        };
        this.dispose(this._opInfo.originPosition.changed.disposableOn(updateLines));
        this.dispose(this._opInfo.destinationPosition.changed.disposableOn(updateLines));

        const updateShow = () => lines.show = this._opInfo.moved.value && this.showCircle;
        updateShow();
        this.dispose(this._opInfo.moved.changed.disposableOn(updateShow));
        this.dispose(this.showCircleChanged.disposableOn(updateShow));
    }

    private _createCircle(czmViewer: ESCesiumViewer) {
        const circle = this.disposeVar(new CzmPolylines(czmViewer));
        circle.arcType = 'RHUMB';
        circle.hasDash = true;
        circle.width = 2;

        const updateColor = () => circle.color = this._opInfo.constraintMode.value === 'zAxis' ? [1, 1, 0, 0.99] : [1, 1, 0, .5];
        updateColor();
        this.dispose(this._opInfo.constraintMode.changed.disposableOn(updateColor));

        {
            const update = () => circle.show = this.enabled && this.showCircle;
            update();
            this.dispose(this.enabledChanged.disposableOn(update));
            this.dispose(this.showCircleChanged.disposableOn(update));
        }

        const geoGridNextFrame = this.disposeVar(createNextAnimateFrameEvent(this._opInfo.originPosition.changed, this._opInfo.originHeading.changed, this._opInfo.originDimensions.changed));

        const updatePosition = () => {
            const p = this._opInfo.originPosition.value;
            const h = this._opInfo.originHeading.value;
            const d = this._opInfo.originDimensions.value[0];

            const positions: [number, number, number][] = [];
            const segements = 32;
            for (let i = 0; i <= segements; ++i) {
                const c = geoRhumbDestination(p, d, i * 360 / segements);
                c && positions.push(c);
            }
            circle.positions = [positions];
        };
        updatePosition();
        this.dispose(geoGridNextFrame.disposableOn(updatePosition));
    }
}

export namespace GeoCoordinatesEditor {
    export const createDefaultProps = () => ({
        enabled: false, // boolean} [show=true] A boolean Property specifying the visibility of the box.
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单位
        heading: 0, // 偏航角，度为单位
        axisPixelSize: 100,
        axisSnapPixelSize: 5,
        showCoordinates: true,
        showCircle: true,
        disableX: false,
        disableY: false,
        disableZ: false,
        disableXY: false,
        disableZAxis: false,
    });
}
extendClassProps(GeoCoordinatesEditor.prototype, GeoCoordinatesEditor.createDefaultProps);
export interface GeoCoordinatesEditor extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoCoordinatesEditor.createDefaultProps>> { }

export function setCoordinatesColor(coordinates: GeoCoordinates, constraintMode: CoordinatesComputingPickingInfo['constraintMode'], transparent: boolean) {
    coordinates.xAxisColor = [1, 0, 0, .99];
    coordinates.yAxisColor = [0, 1, 0, .99];
    coordinates.zAxisColor = [0, 0, 1, .99];

    if (constraintMode === 'x') {
        coordinates.xAxisColor = transparent ? [1, 1, 0, .8] : [1, 1, 0, .99];
    } else if (constraintMode === 'y') {
        coordinates.yAxisColor = transparent ? [1, 1, 0, .8] : [1, 1, 0, .99];
    } else if (constraintMode === 'z') {
        coordinates.zAxisColor = transparent ? [1, 1, 0, .8] : [1, 1, 0, .99];
    } else if (constraintMode === 'xy') {
        coordinates.xAxisColor = transparent ? [1, 1, 0, .8] : [1, 1, 0, .99];
        coordinates.yAxisColor = transparent ? [1, 1, 0, .8] : [1, 1, 0, .99];
    }
}
