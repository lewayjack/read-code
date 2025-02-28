export type ESJParticleEmitterJsonType = {
    type: 'BoxEmitter';
    dimensions: [number, number, number];//The width, height and depth dimensions of the box.
} | {
    type: 'CircleEmitter';
    radius?: number;//optional The radius of the circle in meters.
} | {
    type: 'ConeEmitter';
    angle?: number; //	Number	Cesium.Math.toRadians(30.0)	optionalThe angle of the cone in radians.
} | {
    type: 'SphereEmitter';
    radius?: number;//	Number	1.0	optionalThe radius of the sphere in meters.
};