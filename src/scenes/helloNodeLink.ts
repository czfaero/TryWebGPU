/// <reference types="@webgpu/types" />
import { mat4, quat, vec3 } from 'gl-matrix';
import wgsl from '../shaders/helloNodeLink.wgsl';
import { FPSController } from '../compenents/FPSController';


import { GetNodes, GetLinks, GetNodeColors, GetLinkWeights } from '../diagrams/MatrixMarketLoader'
import { SGDRunner } from '../compenents/SGD';

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
  console.log(presentationFormat);
  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'opaque',
  });

  // 
  const nodes = await GetNodes();
  const links = await GetLinks();


  const nodeColors = await GetNodeColors();
  const nodeColorsBuffer = device.createBuffer({
    size: nodeColors.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(nodeColorsBuffer, 0, nodeColors);

  // For node
  const quadVertexData = new Float32Array([
    -1.0, -1.0, +1.0, -1.0, -1.0, +1.0,
    -1.0, +1.0, +1.0, -1.0, +1.0, +1.0,
  ]);
  const quadVertexBuffer = device.createBuffer({
    size: quadVertexData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(quadVertexBuffer.getMappedRange()).set(quadVertexData);
  quadVertexBuffer.unmap();

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



  // Link
  const linkBuffer = device.createBuffer({
    size: links.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(linkBuffer, 0, links);


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
  const nodePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'main_node_vert',
      buffers: [
        {
          arrayStride: 2 * 4, // vec2 float
          stepMode: 'vertex',
          attributes: [
            {
              // vertex positions
              shaderLocation: 0, offset: 0, format: 'float32x2',
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
      entryPoint: 'main_node_frag',
      targets: [
        {
          format: presentationFormat,
          blend: {
            // The source color is the value written by the fragment shader. 
            // The destination color is the color from the image in the framebuffer.
            // https://www.khronos.org/opengl/wiki/Blending
            color: {
              srcFactor: 'src',
              dstFactor: 'zero',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'zero',
              dstFactor: 'one',
              operation: 'add',
            }
          },
        } as GPUColorTargetState,
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


  // Render - links
  const linkPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'main_link_vert',
      buffers: [
        {
          arrayStride: 2 * 4, // vec2 float
          stepMode: 'vertex',
          attributes: [
            {
              // vertex positions
              shaderLocation: 0, offset: 0, format: 'float32x2',
            }
          ],
        } as GPUVertexBufferLayout,
        {
          arrayStride: 2 * 4, // vec2 u32
          stepMode: 'instance',
          attributes: [
            {
              shaderLocation: 1, offset: 0, format: 'uint32x2',
            }
          ],
        } as GPUVertexBufferLayout
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'main_link_frag',
      targets: [
        {
          format: presentationFormat,
          blend: {
            color: {
              srcFactor: 'src',
              dstFactor: 'zero',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'zero',
              dstFactor: 'one',
              operation: 'add',
            }
          },
        } as GPUColorTargetState,
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

  const uniformBufferSize =Math.max(4 * 4 * 4 + 4 * 3,80); //  float32 4x4 matrix, vec3<f32>;
  const uniformBufferData = new Float32Array(uniformBufferSize / 4);

  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const nodeBindGroup = device.createBindGroup({
    layout: nodePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });
  const linkBindGroup = device.createBindGroup({
    layout: linkPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: nodesBuffer0,
        },
      }
    ],
  });


  mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 300.0);

  // the world
  const worldUp = vec3.fromValues(0, 1, 0);
  const worldOrigin = vec3.fromValues(0, 0, 0);

  let lastTime = performance.now();
  let s = 0;
  let frameCount = 0;
  const camera = new FPSController(vec3.fromValues(0, 0, 20), quat.create());
  function UpdateView(time: DOMHighResTimeStamp) {
    const deltaTime = (time - lastTime) / 1000; //ms -> second double
    lastTime = time;
    camera.Update(deltaTime);

    const viewMatrix = mat4.create();
    const watchCenter = vec3.create();
    vec3.add(watchCenter, camera.position, camera.front);

    mat4.lookAt(
      viewMatrix,
      camera.position,
      watchCenter,
      worldUp
    );
    // x: right y: up z: out screen
    // view matrix = inverse of model matrix of camera
    //mat4.invert(viewMatrix, viewMatrix);
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
    uniformBufferData.set(viewProjectionMatrix, 0);
    uniformBufferData.set(camera.front, 4 * 4);
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      uniformBufferData
    );

    frameCount = (frameCount + 1);
    if (frameCount >= 60) {
      frameCount = 0;
    }
    logger.innerHTML = `FPS:${1 / deltaTime}`;
  }

  const logger = document.createElement('div');
  document.body.append(logger);

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
    renderPassEncoder.setPipeline(nodePipeline);
    renderPassEncoder.setBindGroup(0, nodeBindGroup);
    renderPassEncoder.setVertexBuffer(0, quadVertexBuffer);
    renderPassEncoder.setVertexBuffer(1, nodesBuffers[0]);
    renderPassEncoder.setVertexBuffer(2, nodeColorsBuffer);
    renderPassEncoder.draw(quadVertexData.length / 2, nodes.length / 3, 0, 0);
    renderPassEncoder.setPipeline(linkPipeline);
    renderPassEncoder.setBindGroup(0, linkBindGroup);
    renderPassEncoder.setVertexBuffer(1, linkBuffer);
    renderPassEncoder.draw(quadVertexData.length / 2, links.length / 2, 0, 0);

    renderPassEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(Update);
  }

  requestAnimationFrame(Update);
};



export default init;