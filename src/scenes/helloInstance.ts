/// <reference types="@webgpu/types" />

import { GetVertex, GetIndices, GetColors } from '../meshes/triangle'
import instanceWGSL from '../shaders/instance.wgsl';

const init = async (canvasElement: HTMLCanvasElement) => {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();


    const context = canvasElement.getContext('webgpu') as GPUCanvasContext;

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'opaque',
    });


    // prepare data

    const vertex = GetVertex();
    const indices = GetIndices();
    const colors = GetColors();

    const instancePos = new Float32Array([
        0.5, -0.5, 1,
        0.5, 0.5, 1,
        -0.5, 0.5, 1,
        -0.5, -0.5, 1,
        0, 0, 1
    ]);
    const vertexBuffer = device.createBuffer({
        size: vertex.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    const colorBuffer = device.createBuffer({
        size: colors.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    const indicesBuffer = device.createBuffer({
        size: indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });

    const instanceBuffer = device.createBuffer({
        size: instancePos.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertex);
    device.queue.writeBuffer(indicesBuffer, 0, indices);
    device.queue.writeBuffer(colorBuffer, 0, colors);
    device.queue.writeBuffer(instanceBuffer, 0, instancePos);

    // settings
    const shaderModule = device.createShaderModule({ code: instanceWGSL });

    const renderPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'main_vert',
            buffers: [
                {
                    arrayStride: 3 * 4,
                    stepMode: 'vertex',
                    attributes: [
                        {
                            // vertex positions
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x3',
                        }
                    ],
                } as GPUVertexBufferLayout,
                {
                    arrayStride: 3 * 4,
                    stepMode: 'vertex',
                    attributes: [
                        {
                            // vertex color
                            shaderLocation: 1,
                            offset: 0,
                            format: 'float32x3',
                        },
                    ],
                } as GPUVertexBufferLayout,
                {
                    // instanced particles buffer
                    arrayStride: 3 * 4,
                    stepMode: 'instance',
                    attributes: [
                        {
                            // instance position
                            shaderLocation: 2,
                            offset: 0,
                            format: 'float32x3',
                        },
                    ],
                } as GPUVertexBufferLayout,
            ],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'main_frag',
            targets: [
                {
                    format: presentationFormat,
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    function Update() {

        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                } as GPURenderPassColorAttachment
            ],
        };

        const renderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        renderPassEncoder.setPipeline(renderPipeline);

        renderPassEncoder.setVertexBuffer(0, vertexBuffer);
        renderPassEncoder.setVertexBuffer(1, colorBuffer);
        renderPassEncoder.setVertexBuffer(2, instanceBuffer);
        renderPassEncoder.setIndexBuffer(indicesBuffer, 'uint32');
        renderPassEncoder.draw(vertex.length / 3, instancePos.length / 3, 0, 0);
        renderPassEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(Update);
    }

    requestAnimationFrame(Update);
};



export default init;