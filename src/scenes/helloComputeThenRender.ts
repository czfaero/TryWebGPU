/// <reference types="@webgpu/types" />

import wgsl from '../shaders/helloComputeThenRender.wgsl';


import { GetVertex, GetIndices } from '../meshes/triangle'

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


  // https://www.w3.org/TR/webgpu/#buffer-usage
  const vertexBuffer = device.createBuffer({
    size: vertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });

  const indicesBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertex);
  device.queue.writeBuffer(indicesBuffer, 0, indices);


  const shaderModule = device.createShaderModule({
    code: wgsl,
  })
  const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: []
    }),
    compute: {
      module: shaderModule,
      entryPoint: "main_comp"
    }
  });

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



  function Update() {

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
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);

    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setIndexBuffer(indicesBuffer, 'uint32');
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(Update);
  }

  requestAnimationFrame(Update);
};



export default init;