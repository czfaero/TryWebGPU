/// <reference types="@webgpu/types" />
import { mat4, quat, vec3 } from 'gl-matrix';
import wgsl from '../shaders/helloNodeLink.wgsl';


import { GetNodes, GetLinks, GetNodeColors } from '../diagrams/triangle'
import { GetVertex, GetIndices } from '../meshes/cube'


const init = async (canvasElement: HTMLCanvasElement) => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  const context = canvasElement.getContext('webgpu') as unknown as GPUCanvasContext;

  const devicePixelRatio = window.devicePixelRatio || 1;
  // const presentationSize = [
  //   canvasElement.clientWidth * devicePixelRatio,
  //   canvasElement.clientHeight * devicePixelRatio,
  // ];
  //Will cause: Attachment [TextureView] size does not match the size of the other attachments. 
  //            - While validating depthStencilAttachment.

  const presentationSize = [
    canvasElement.clientWidth,
    canvasElement.clientHeight,
  ];
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'opaque',
  });

  // 
  const nodes = GetNodes();
  const links = GetLinks();
  const nodeColors = GetNodeColors();
  const nodeColorsBuffer = device.createBuffer({
    size: nodeColors.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(nodeColorsBuffer, 0, nodeColors);

  // For node
  const vertex = GetVertex();
  const indices = GetIndices();
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


  // The node pos buffers for both computing and rendering
  const nodesBuffer0 = device.createBuffer({
    size: nodes.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const nodesBuffer1 = device.createBuffer({
    size: nodes.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
  });
  const nodesBuffers = [nodesBuffer0, nodesBuffer1];
  device.queue.writeBuffer(nodesBuffer0, 0, nodes);

  const shaderModule = device.createShaderModule({
    code: wgsl,
  })
  // Compute 

  // const computePipeline = device.createComputePipeline({
  //   layout: 'auto',
  //   compute: {
  //     module: shaderModule,
  //     entryPoint: "comp"
  //   }
  // });
  // const bindGroupLayout = computePipeline.getBindGroupLayout(0);
  // const bindGroup0 = device.createBindGroup({
  //   layout: bindGroupLayout,
  //   entries: [
  //     { binding: 0, resource: { buffer: posBuffer0 } },
  //     { binding: 1, resource: { buffer: posBuffer1 } },
  //   ]
  // });
  // const bindGroup1 = device.createBindGroup({
  //   layout: bindGroupLayout,
  //   entries: [
  //     { binding: 0, resource: { buffer: posBuffer1 } },
  //     { binding: 1, resource: { buffer: posBuffer0 } },
  //   ]
  // });

  // Render - nodes
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'main_node_vert',
      buffers: [
        {
          arrayStride: 3 * 4,
          stepMode: 'vertex',
          attributes: [
            {
              // vertex positions
              shaderLocation: 0, offset: 0, format: 'float32x3',
            }
          ],
        } as GPUVertexBufferLayout,
        {
          // instanced particles buffer
          arrayStride: 3 * 4,
          stepMode: 'instance',
          attributes: [
            {
              // instance position
              shaderLocation: 1, offset: 0, format: 'float32x3',
            },
          ],
        } as GPUVertexBufferLayout,
        {
          // instanced particles buffer
          arrayStride: 3 * 4,
          stepMode: 'instance',
          attributes: [
            {
              // instance color
              shaderLocation: 2, offset: 0, format: 'float32x3',
            },
          ],
        } as GPUVertexBufferLayout,
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'main_frag',
      targets: [
        { format: presentationFormat },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  });
  const depthTexture = device.createTexture({
    size: presentationSize,
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // uniform
  const aspect = presentationSize[0] / presentationSize[1];
  const projectionMatrix = mat4.create();

  const uniformBufferSize = 4 * 4 * 4; // float32 4x4 matrix;
  const uniformBufferData = new Float32Array(uniformBufferSize / 4);

  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);


  let lastTime = performance.now();
  let s = 0;
  let axis = vec3.fromValues(0, 1, 0);
  let frameCount = 0;
  function UpdateView(time: DOMHighResTimeStamp) {
    const deltaTime = time - lastTime; //ms double
    lastTime = time;
    s += deltaTime * 0.001;// 1 rad per second
    //console.log(s)
    const viewMatrix = mat4.create();
    const rotation = quat.create();
    const pos = vec3.fromValues(Math.sin(s) * 10, -1, Math.cos(s) * 10);
    quat.fromEuler(rotation, 0, s / Math.PI * 180, 0)
    mat4.fromRotationTranslation(
      viewMatrix,
      rotation,
      pos
    );
    // x: right y: up z: out screen
    // view matrix = inverse of model matrix of camera
    mat4.invert(viewMatrix, viewMatrix);
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
    uniformBufferData.set(viewProjectionMatrix, 0);
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      uniformBufferData
    );

    frameCount = (frameCount + 1);
    if (frameCount >= 60) {
      //console.log(`FPS:${1000 / deltaTime}`)
      frameCount = 0;
    }
  }

  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });




  function Update(time: DOMHighResTimeStamp) {
    UpdateView(time);
    const commandEncoder = device.createCommandEncoder();

    // Must create every time, or there would be 'Destroyed texture [Texture] used in a submit.'
    const textureView = context.getCurrentTexture().createView();

    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,

          clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),

        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    } as GPURenderPassDescriptor;

    // const computePassEncoder = commandEncoder.beginComputePass();
    // computePassEncoder.setPipeline(computePipeline);
    // computePassEncoder.setBindGroup(0, frameCount % 2 === 0 ? bindGroup0 : bindGroup1);
    // computePassEncoder.dispatchWorkgroups(3, 1);
    // computePassEncoder.end();


    const renderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPassEncoder.setPipeline(pipeline);
    renderPassEncoder.setBindGroup(0, uniformBindGroup);
    renderPassEncoder.setVertexBuffer(0, vertexBuffer);
    renderPassEncoder.setVertexBuffer(1, nodesBuffers[0]);
    renderPassEncoder.setVertexBuffer(2, nodeColorsBuffer);
    renderPassEncoder.setIndexBuffer(indicesBuffer, 'uint32');
    //renderPassEncoder.draw(vertex.length / 3, nodes.length / 3, 0, 0);
    renderPassEncoder.drawIndexed(indices.length, nodes.length / 3);
    renderPassEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(Update);
  }

  requestAnimationFrame(Update);
};



export default init;