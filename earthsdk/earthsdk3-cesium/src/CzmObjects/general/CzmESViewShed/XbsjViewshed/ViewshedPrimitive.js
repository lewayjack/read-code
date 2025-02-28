//import Cesium from 'Cesium';
import * as Cesium from 'cesium';

function getDir(heading, pitch) {
    const h = heading;
    const p = pitch;
    const c = Math.cos;
    const s = Math.sin;
    // WebGL默认视角
    // var dir = [s(h) * c(p), s(p),  -1.0 * c(h) * c(p)];
    // Cesium视角
    var dir = [c(-h) * c(-p), s(-h) * c(-p), s(-p)];
    return dir;
}

function getFov(fov, segment, index) {
    return fov * (-0.5 + index / segment);
}

function getGridDirs(fovH, fovV, segmentH, segmentV) {
    const dirs = new Float32Array((segmentH + 1) * (segmentV + 1) * 3 + 3);
    for (let i = 0; i < segmentH + 1; ++i) {
        for (let j = 0; j < segmentV + 1; ++j) {
            const dir = getDir(getFov(fovH, segmentH, i), getFov(fovV, segmentV, j));
            dirs[(j * (segmentH + 1) + i) * 3 + 0] = dir[0];
            dirs[(j * (segmentH + 1) + i) * 3 + 1] = dir[1];
            dirs[(j * (segmentH + 1) + i) * 3 + 2] = dir[2];
        }
    }

    // 增加原点
    dirs[(segmentH + 1) * (segmentV + 1) * 3 + 0] = 0;
    dirs[(segmentH + 1) * (segmentV + 1) * 3 + 1] = 0;
    dirs[(segmentH + 1) * (segmentV + 1) * 3 + 2] = 0;

    return dirs;
}

function getGridIndices(segmentH, segmentV) {
    var indices = new Uint16Array(segmentH * segmentV * 6);
    for (let i = 0; i < segmentH; ++i) {
        for (let j = 0; j < segmentV; ++j) {
            const lb = j * (segmentH + 1) + i;
            const rb = j * (segmentH + 1) + i + 1;
            const lt = (j + 1) * (segmentH + 1) + i;
            const rt = (j + 1) * (segmentH + 1) + i + 1;
            const start = (j * segmentH + i) * 6;
            indices[start + 0] = lb;
            indices[start + 1] = rb;
            indices[start + 2] = rt;
            indices[start + 3] = lb;
            indices[start + 4] = rt;
            indices[start + 5] = lt;
        }
    }

    return indices;
}

// 线段索引的计算方法
// 顶点和面片用的一致
function getLineGridIndices(segmentH, segmentV, subsegmentH, subSegmentV) {
    const finalSegmentH = segmentH * subsegmentH;
    const finalSegmentV = segmentV * subSegmentV;
    const indices = new Uint16Array((segmentH + 1) * (finalSegmentV * 2) + (segmentV + 1) * (finalSegmentH * 2) + 4 * 2);

    for (let i = 0; i < segmentH + 1; ++i) {
        for (let j = 0; j < finalSegmentV; ++j) {
            const fi = i * subsegmentH;
            indices[(i * finalSegmentV + j) * 2 + 0] = j * (finalSegmentH + 1) + fi;
            indices[(i * finalSegmentV + j) * 2 + 1] = (j + 1) * (finalSegmentH + 1) + fi;
        }
    }

    const lastIndex = (segmentH + 1) * (finalSegmentV * 2);

    for (let j = 0; j < segmentV + 1; ++j) {
        for (let i = 0; i < finalSegmentH; ++i) {
            const fj = j * subSegmentV;
            indices[lastIndex + (i + j * finalSegmentH) * 2 + 0] = fj * (finalSegmentH + 1) + i;
            indices[lastIndex + (i + j * finalSegmentH) * 2 + 1] = fj * (finalSegmentH + 1) + i + 1;
        }
    }

    const lastIndex2 = (segmentH + 1) * (finalSegmentV * 2) + (segmentV + 1) * (finalSegmentH * 2);

    // 和原点的联系
    const lb = 0;
    const rb = finalSegmentH;
    const lt = (finalSegmentH + 1) * finalSegmentV;
    const rt = (finalSegmentH + 1) * (finalSegmentV + 1) - 1;

    indices[lastIndex2 + 0] = lb;
    indices[lastIndex2 + 1] = (finalSegmentH + 1) * (finalSegmentV + 1);

    indices[lastIndex2 + 2] = rb;
    indices[lastIndex2 + 3] = (finalSegmentH + 1) * (finalSegmentV + 1);

    indices[lastIndex2 + 4] = lt;
    indices[lastIndex2 + 5] = (finalSegmentH + 1) * (finalSegmentV + 1);

    indices[lastIndex2 + 6] = rt;
    indices[lastIndex2 + 7] = (finalSegmentH + 1) * (finalSegmentV + 1);

    return indices;
}

var vtxfVertexShader =
    `
            // vtxf 使用double类型的position进行计算
            // in vec3 position3DHigh;
            // in vec3 position3DLow;
            in vec3 position;
            in vec3 normal;
            // in vec2 st;
            // in float batchId;

            out vec3 v_positionEC;
            out vec3 v_normalEC;
            // out vec2 v_st;

            void main()
            {
                // vtxf 使用double类型的position进行计算
                // vec4 p = czm_translateRelativeToEye(position3DHigh, position3DLow);
                // v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
                // v_normalEC = czm_normal * normal;                         // normal in eye coordinates
                // v_st = st;
                // gl_Position = czm_modelViewProjectionRelativeToEye * p;

                v_positionEC = (czm_modelView * vec4(position, 1.0)).xyz;       // position in eye coordinates
                v_normalEC = czm_normal * normal;                               // normal in eye coordinates
                // v_st = st;
                gl_Position = czm_modelViewProjection * vec4(position, 1.0);
            }
            `;

var vtxfFragmentShader =
    `
            in vec3 v_positionEC;
            in vec3 v_normalEC;
            //  vec2 v_st;

            // uniform sampler2D myImage;
            uniform vec4 xbsjColor;

            void main()
            {
                vec3 positionToEyeEC = -v_positionEC;

                vec3 normalEC = normalize(v_normalEC);
            #ifdef FACE_FORWARD
                normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
            #endif

                czm_materialInput materialInput;
                materialInput.normalEC = normalEC;
                materialInput.positionToEyeEC = positionToEyeEC;
                // materialInput.st = v_st;

                //czm_material material = czm_getMaterial(materialInput);
                czm_material material = czm_getDefaultMaterial(materialInput);
                // material.diffuse = texture2D(myImage, materialInput.st).rgb;
                material.diffuse = xbsjColor.rgb;
                material.alpha = xbsjColor.a;

            #ifdef FLAT
                out_FragColor = vec4(material.diffuse + material.emission, material.alpha);
            #else
                // out_FragColor = czm_phong(normalize(positionToEyeEC), material);
                out_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
            #endif
            }
            `;

var attributeLocations = {
    position: 0,
    normal: 1,
};

// 1 自定义Primitive
export class ViewshedPrimitive {
    constructor(options) {
        // this.modelMatrix = Cesium.defaultValue(options.modelMatrix, Cesium.Matrix4.IDENTITY);
        this.modelMatrix = Cesium.defaultValue(options.modelMatrix, new Cesium.Matrix4());
        this.fovH = Cesium.defaultValue(options.fovH, Cesium.Math.toRadians(60));
        this.fovV = Cesium.defaultValue(options.fovV, Cesium.Math.toRadians(30));
        this.segmentH = Cesium.defaultValue(options.segmentH, 6);
        this.segmentV = Cesium.defaultValue(options.segmentV, 3);
        this.subSegmentH = Cesium.defaultValue(options.subSegmentH, 3);
        this.subSegmentV = Cesium.defaultValue(options.subSegmentV, 3);
        this._faceColor = Cesium.defaultValue(options.faceColor, new Cesium.Color(1.0, 1.0, 0.0, 0.5));
        this._lineColor = Cesium.defaultValue(options.lineColor, new Cesium.Color(1.0, 0.0, 0.0));
        this.show = Cesium.defaultValue(options.lineColor, true);

        this._modelMatrix = Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY);

        this._fovH = 0.0;
        this._fovV = 0.0;
        this._segmentH = 1;
        this._segmentV = 1;
        this._subSegmentH = 1;
        this._subSegmentV = 1;

        this._boundingSphere = new Cesium.BoundingSphere();
        this._initBoundingSphere = undefined;
        this._command = undefined;
    }

    // 1.9 创建command
    _createCommand(context) {
        // const tr = Cesium.Math.toRadians;
        const finalSegmentH = this._subSegmentH * this._segmentH;
        const finalSegmentV = this._subSegmentV * this._segmentV;
        var positions = getGridDirs(this._fovH, this._fovV, finalSegmentH, finalSegmentV);
        var normals = getGridDirs(this._fovH, this._fovV, finalSegmentH, finalSegmentV);
        var indices = getGridIndices(finalSegmentH, finalSegmentV);
        var lineIndices = getLineGridIndices(this._segmentH, this._segmentV, this._subSegmentH, this._subSegmentV);

        var translucent = true;
        var closed = false;
        // 借用一下Appearance.getDefaultRenderState
        var rawRenderState = Cesium.Appearance.getDefaultRenderState(translucent, closed, undefined);
        var renderState = Cesium.RenderState.fromCache(rawRenderState);

        var vertexShaderSource = new Cesium.ShaderSource({
            sources: [vtxfVertexShader]
        });

        var fragmentShaderSource = new Cesium.ShaderSource({
            sources: [vtxfFragmentShader]
        });

        var uniformMap = {
            xbsjColor: () => this._faceColor,
        }

        var lineUniformMap = {
            xbsjColor: () => this._lineColor,
        }

        var shaderProgram = Cesium.ShaderProgram.fromCache({
            context: context,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
            attributeLocations: attributeLocations
        });

        this._shaderprogram = shaderProgram;

        var positionBuffer = Cesium.Buffer.createVertexBuffer({
            context: context,
            // sizeInBytes: 12,
            typedArray: positions,
            usage: Cesium.BufferUsage.STATIC_DRAW
        });

        var normalBuffer = Cesium.Buffer.createVertexBuffer({
            context: context,
            // sizeInBytes: 12,
            typedArray: normals,
            usage: Cesium.BufferUsage.STATIC_DRAW
        });

        var indexBuffer = Cesium.Buffer.createIndexBuffer({
            context: context,
            typedArray: indices,
            usage: Cesium.BufferUsage.STATIC_DRAW,
            indexDatatype: Cesium.IndexDatatype.UNSIGNED_SHORT
        });

        var lineIndexBuffer = Cesium.Buffer.createIndexBuffer({
            context: context,
            typedArray: lineIndices,
            usage: Cesium.BufferUsage.STATIC_DRAW,
            indexDatatype: Cesium.IndexDatatype.UNSIGNED_SHORT
        });

        const vertexArray = new Cesium.VertexArray({
            context: context,
            attributes: [{
                index: 0,
                vertexBuffer: positionBuffer,
                componentsPerAttribute: 3,
                componentDatatype: Cesium.ComponentDatatype.FLOAT
            }, {
                index: 1,
                vertexBuffer: normalBuffer,
                componentsPerAttribute: 3,
                componentDatatype: Cesium.ComponentDatatype.FLOAT
            }],
            indexBuffer: indexBuffer,
        });

        const lineVertexArray = new Cesium.VertexArray({
            context: context,
            attributes: [{
                index: 0,
                vertexBuffer: positionBuffer,
                componentsPerAttribute: 3,
                componentDatatype: Cesium.ComponentDatatype.FLOAT
            }, {
                index: 1,
                vertexBuffer: normalBuffer,
                componentsPerAttribute: 3,
                componentDatatype: Cesium.ComponentDatatype.FLOAT
            }],
            indexBuffer: lineIndexBuffer,
        });

        this._initBoundingSphere = Cesium.BoundingSphere.fromVertices(positions);

        this._command = new Cesium.DrawCommand({
            vertexArray: vertexArray,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            renderState: renderState,
            shaderProgram: shaderProgram,
            uniformMap: uniformMap,
            owner: this,
            pass: Cesium.Pass.TRANSLUCENT,
            modelMatrix: new Cesium.Matrix4(),
            boundingVolume: new Cesium.BoundingSphere(),
            cull: true,
        });

        this._lineCommand = new Cesium.DrawCommand({
            vertexArray: lineVertexArray,
            primitiveType: Cesium.PrimitiveType.LINES,
            renderState: renderState,
            shaderProgram: shaderProgram,
            uniformMap: lineUniformMap,
            owner: this,
            pass: Cesium.Pass.TRANSLUCENT,
            modelMatrix: new Cesium.Matrix4(),
            boundingVolume: new Cesium.BoundingSphere(),
            cull: true,
        });
    }

    update(frameState) {
        if (!this.show) {
            return;
        }

        if (!frameState.passes.render) {
            return;
        }

        const dirty =
            this.fovH !== this._fovH ||
            this.fovV !== this._fovV ||
            this.segmentH !== this._segmentH ||
            this.segmentV !== this._segmentV ||
            this.subSegmentH !== this._subSegmentH ||
            this.subSegmentV !== this._subSegmentV;
        if (dirty) {
            this._fovH = this.fovH;
            this._fovV = this.fovV;
            this._segmentH = this.segmentH;
            this._segmentV = this.segmentV;
            this._subSegmentH = this.subSegmentH;
            this._subSegmentV = this.subSegmentV;
            this._modelMatrix = Cesium.clone(Cesium.Matrix4.IDENTITY);

            this._destroyVideoMemory();
        }

        if (!Cesium.defined(this._command)) {
            this._createCommand(frameState.context);
        }

        if (!Cesium.Matrix4.equals(this.modelMatrix, this._modelMatrix)) {
            Cesium.Matrix4.clone(this.modelMatrix, this._modelMatrix);
            this._command.modelMatrix = Cesium.Matrix4.IDENTITY;
            this._command.modelMatrix = this._modelMatrix;
            this._command.boundingVolume = Cesium.BoundingSphere.transform(this._initBoundingSphere, this._modelMatrix, this._boundingSphere);

            this._lineCommand.modelMatrix = Cesium.Matrix4.IDENTITY;
            this._lineCommand.modelMatrix = this._modelMatrix;
            this._lineCommand.boundingVolume = Cesium.BoundingSphere.transform(this._initBoundingSphere, this._modelMatrix, this._boundingSphere);
        }

        this._command && frameState.commandList.push(this._command);
        this._lineCommand && frameState.commandList.push(this._lineCommand);
    }

    isDestroyed() {
        return false;
    }

    _destroyVideoMemory() {
        // 两个command共用了一个shaderProgram，不能销毁两次，否则报错
        this._shaderprogram = this._shaderprogram && this._shaderprogram.destroy();

        if (Cesium.defined(this._command)) {
            // this._command.shaderProgram = this._command.shaderProgram && this._command.shaderProgram.destroy();
            this._command.vertexArray = this._command.vertexArray && this._command.vertexArray.destroy();
            this._command = undefined;
        }

        if (Cesium.defined(this._lineCommand)) {
            // this._lineCommand.shaderProgram = this._lineCommand.shaderProgram && this._lineCommand.shaderProgram.destroy();
            this._lineCommand.vertexArray = this._lineCommand.vertexArray && this._lineCommand.vertexArray.destroy();
            this._lineCommand = undefined;
        }
    }

    destroy() {
        this._destroyVideoMemory();
        return Cesium.destroyObject(this);
    };
}
