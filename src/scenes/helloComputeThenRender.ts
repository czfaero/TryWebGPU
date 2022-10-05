/// <reference types="@webgpu/types" />

import wgsl from '../shaders/helloComputeThenRender.wgsl';


import { GetVertex, GetIndices, GetColors } from '../meshes/triangle'

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

  const vertex = GetVertex();
  const indices = GetIndices();
  const colors = GetColors();


  // https://www.w3.org/TR/webgpu/#buffer-usage
  const vertexBuffer = device.createBuffer({
    size: vertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });

  const colorBuffer0 = device.createBuffer({
    size: colors.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const colorBuffer1 = device.createBuffer({
    size: colors.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
  });
  const colorBuffers = [colorBuffer0, colorBuffer1];


  const indicesBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertex);
  device.queue.writeBuffer(indicesBuffer, 0, indices);
  device.queue.writeBuffer(colorBuffer0, 0, colors);


  // Compute 

  const shaderModule = device.createShaderModule({
    code: wgsl,
  })
  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: "main_comp"
    }
  });
  const bindGroupLayout = computePipeline.getBindGroupLayout(0);
  const bindGroup0 = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: colorBuffer0 } },
      { binding: 1, resource: { buffer: colorBuffer1 } },
    ]
  });
  const bindGroup1 = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: colorBuffer1 } },
      { binding: 1, resource: { buffer: colorBuffer0 } },
    ]
  });

  // Render
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'main_vert',
      buffers: [
        {
          arrayStride: 12, attributes: [
            { shaderLocation: 0, format: "float32x3", offset: 0 }
          ]
        } as GPUVertexBufferLayout,
        {
          arrayStride: 12, attributes: [
            { shaderLocation: 1, format: "float32x3", offset: 0 }
          ]
        } as GPUVertexBufferLayout
      ]
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


  let frameCount = 0;
  function Update(time: DOMHighResTimeStamp) {

    const commandEncoder = device.createCommandEncoder();

    // Must create every time, or there would be 'Destroyed texture [Texture] used in a submit.'
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
    const computePassEncoder = commandEncoder.beginComputePass();
    computePassEncoder.setPipeline(computePipeline);
    computePassEncoder.setBindGroup(0, frameCount % 2 === 0 ? bindGroup0 : bindGroup1);
    computePassEncoder.dispatchWorkgroups(3, 1);
    computePassEncoder.end();


    const renderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPassEncoder.setPipeline(pipeline);

    renderPassEncoder.setVertexBuffer(0, vertexBuffer);
    renderPassEncoder.setVertexBuffer(1, colorBuffers[frameCount % 2]);
    renderPassEncoder.setIndexBuffer(indicesBuffer, 'uint32');
    // https://www.w3.org/TR/webgpu/#rendering-operations
    // draw(vertexCount, instanceCount, firstVertex, firstInstance)
    renderPassEncoder.draw(vertex.length / 3, 1, 0, 0);
    renderPassEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(Update);
    frameCount = (frameCount + 1) % 2;
  }

  requestAnimationFrame(Update);
};



export default init;