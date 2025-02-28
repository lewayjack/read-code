export const previewCustomPrimitiveJson = {
    "id": "e80d8802-e7dc-40d6-8cff-cfe3a12c8763",
    "type": "CzmCustomPrimitive",
    "show": true,
    "allowPicking": true,
    "cull": false,
    "pass": "OVERLAY",
    "vertexShaderSource": "in vec3 position;\nin vec2 st;\nuniform sampler2D u_image;\nout vec2 v_st;\nvoid main()\n{\n    vec2 texture_size = vec2(textureSize(u_image, 0));\n    vec2 viewport_size = czm_viewport.zw;\n    float wh_ratio = (texture_size.x / texture_size.y) * (viewport_size.y / viewport_size.x);\n    v_st = st;\n    gl_Position = vec4(position * vec3(wh_ratio, 1.0, 1.0), 1.0);\n}\n",
    "fragmentShaderSource": "in vec2 v_st;\nuniform sampler2D u_image;\nvoid main()\n{\n    vec4 imageColor = texture(u_image, v_st);\n    out_FragColor = imageColor;\n}\n",
    "uniformMap": {
        "u_image": {
            "type": "texture",
            "id": "059734c9-7bba-489a-854d-9ce3bfedd86a"
        }
    },
    "name": "自定义屏幕图元_clone",
    "attributes": {
        "position": {
            "typedArray": {
                "type": "Float32Array",
                "array": [
                    -0.5,
                    0.5,
                    0,
                    -0.5,
                    -0.5,
                    0,
                    0.5,
                    -0.5,
                    0,
                    -0.5,
                    0.5,
                    0,
                    0.5,
                    -0.5,
                    0,
                    0.5,
                    0.5,
                    0
                ]
            },
            "componentsPerAttribute": 3
        },
        "textureCoordinates": {
            "typedArray": {
                "type": "Float32Array",
                "array": [
                    0,
                    1,
                    0,
                    0,
                    1,
                    0,
                    0,
                    1,
                    1,
                    0,
                    1,
                    1
                ]
            },
            "componentsPerAttribute": 2
        }
    }
};
