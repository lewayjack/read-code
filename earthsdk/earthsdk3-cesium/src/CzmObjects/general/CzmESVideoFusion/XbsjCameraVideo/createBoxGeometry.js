import * as Cesium from 'cesium';

var diffScratch = new Cesium.Cartesian3();

function createBoxGeoemtry(isLinesMode) {
    var min = new Cesium.Cartesian3(-1, -1, -1);
    var max = new Cesium.Cartesian3(1, 1, 1);

    // hack手法，
    // 将顶点坐标y值都提升到大于0，从而避免scene3DOnly为false时导致的geoemtry被分割。
    // 同时shader中再减一下就ok了。
    min.y += 1.001;
    max.y += 1.001;

    // Positions only - no need to duplicate corner points
    var positions = new Float64Array(8 * 3);

    positions[0] = min.x; // 左 0
    positions[1] = min.y; // 下
    positions[2] = min.z; // 后

    positions[3] = max.x; // 右 1
    positions[4] = min.y; // 下
    positions[5] = min.z; // 后

    positions[6] = max.x; // 右 2
    positions[7] = max.y; // 上
    positions[8] = min.z; // 后

    positions[9] = min.x; // 左 3
    positions[10] = max.y; // 上
    positions[11] = min.z; // 后

    positions[12] = min.x; // 左 4
    positions[13] = min.y; // 下
    positions[14] = max.z; // 前

    positions[15] = max.x; // 右 5
    positions[16] = min.y; // 下
    positions[17] = max.z; // 前

    positions[18] = max.x; // 右 6
    positions[19] = max.y; // 上
    positions[20] = max.z; // 前

    positions[21] = min.x; // 左 7
    positions[22] = max.y; // 上
    positions[23] = max.z; // 前

    var attributes = new Cesium.GeometryAttributes();

    attributes.position = new Cesium.GeometryAttribute({
        componentDatatype : Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute : 3,
        values : positions
    });

    // 12 triangles:  6 faces, 2 triangles each.
    var indices = new Uint16Array(6 * 2 * 3);

    // plane z = corner.Z
    indices[0] = 4;
    indices[1] = 5;
    indices[2] = 6;
    indices[3] = 4;
    indices[4] = 6;
    indices[5] = 7;

    // plane z = -corner.Z
    indices[6] = 1;
    indices[7] = 0;
    indices[8] = 3;
    indices[9] = 1;
    indices[10] = 3;
    indices[11] = 2;

    // plane x = corner.X
    indices[12] = 1;
    indices[13] = 6;
    indices[14] = 5;
    indices[15] = 1;
    indices[16] = 2;
    indices[17] = 6;

    // plane y = corner.Y
    indices[18] = 2;
    indices[19] = 3;
    indices[20] = 7;
    indices[21] = 2;
    indices[22] = 7;
    indices[23] = 6;

    // plane x = -corner.X
    indices[24] = 3;
    indices[25] = 0;
    indices[26] = 4;
    indices[27] = 3;
    indices[28] = 4;
    indices[29] = 7;

    // plane y = -corner.Y
    indices[30] = 0;
    indices[31] = 1;
    indices[32] = 5;
    indices[33] = 0;
    indices[34] = 5;
    indices[35] = 4;

    for (var i=0; i<36; i+=3) {
        indices[i] = indices[i] ^ indices[i+2];
        indices[i+2] = indices[i] ^ indices[i+2];
        indices[i] = indices[i] ^ indices[i+2];
    }

    var indices2;

    if (isLinesMode) {
        // triangle
        // indices2 = new Uint16Array(6 * 2 * 6);
        // for (var i=0; i<12; i++) {
        //     indices2[i*6+0] = indices[i*3+0];
        //     indices2[i*6+1] = indices[i*3+1];
        //     indices2[i*6+2] = indices[i*3+2];
        //     indices2[i*6+3] = indices[i*3+1];
        //     indices2[i*6+4] = indices[i*3+2];
        //     indices2[i*6+5] = indices[i*3+0];
        // }

        // quad
        indices2 = new Uint16Array(6 * 2 * 2);
        indices2[0] = 0;
        indices2[1] = 1;
        indices2[2] = 1;
        indices2[3] = 2;
        indices2[4] = 2;
        indices2[5] = 3;
        indices2[6] = 3;
        indices2[7] = 0;

        indices2[8] = 4;
        indices2[9] = 5;
        indices2[10] = 5;
        indices2[11] = 6;
        indices2[12] = 6;
        indices2[13] = 7;
        indices2[14] = 7;
        indices2[15] = 4;

        indices2[16] = 0;
        indices2[17] = 4;
        indices2[18] = 1;
        indices2[19] = 5;
        indices2[20] = 2;
        indices2[21] = 6;
        indices2[22] = 3;
        indices2[23] = 7;
    }

    var diff = Cesium.Cartesian3.subtract(max, min, diffScratch);
    var radius = Cesium.Cartesian3.magnitude(diff) * 0.5;

    return new Cesium.Geometry({
        attributes : attributes,
        // indices : indices,
        indices : !isLinesMode ? indices : indices2,
        // primitiveType : Cesium.PrimitiveType.TRIANGLES,
        primitiveType : !isLinesMode ? Cesium.PrimitiveType.TRIANGLES : Cesium.PrimitiveType.LINES,
        boundingSphere : new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, radius),
    });
}

export default createBoxGeoemtry;