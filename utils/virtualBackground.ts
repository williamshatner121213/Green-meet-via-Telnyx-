import { MutableRefObject } from 'react';

import { VideoProcessor, Camera } from '@telnyx/video-processors';

export interface VirtualBackground {
  videoProcessor: MutableRefObject<VideoProcessor | null>;
  camera: MutableRefObject<Camera | null>;
  videoElementId: string;
  canvasElementId: string;
  videoTrack: MediaStreamTrack | undefined;
  backgroundValue: string;
}

export const imagesOptions = [
  {
    label: 'none',
    value: 'none',
  },
  {
    label: 'blur',
    value: 'blur',
  },
  {
    label: 'retro',
    value: 'retro.webp',
  },
  {
    label: 'mansao',
    value: 'mansao.webp',
  },
  {
    label: 'nature',
    value: 'nature.webp',
  },
];

export const addVirtualBackgroundStream = async ({
  videoProcessor,
  camera,
  videoElementId,
  canvasElementId,
  videoTrack,
  backgroundValue,
}: VirtualBackground): Promise<MediaStreamTrack | undefined> => {
  if (
    !videoElementId ||
    !canvasElementId ||
    !videoTrack ||
    !videoProcessor ||
    !camera
  ) {
    console.error('Failed to set virtual background');
    return undefined;
  }

  if (!backgroundValue || backgroundValue === 'none') {
    await camera.current?.stop();
    if (videoProcessor.current) {
      await videoProcessor.current?.stop();
      videoProcessor.current = null;
    }
    camera.current = null;

    return videoTrack;
  } else if (backgroundValue !== 'blur') {
    // We use this image as our virtual background
    const image = new Image(996, 664);

    /*
      The image should be hosted in the same domain as your telnyx-meet application otherwise you will get this issue 
      https://www.w3.org/TR/mediacapture-fromelement/#html-canvas-element-media-capture-extensions
      https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
    */
    image.src = `/${backgroundValue}`;

    if (
      !videoProcessor.current ||
      !videoProcessor.current.isVideoProcessorActived()
    ) {
      videoProcessor.current = new VideoProcessor();
    }

    if (camera.current) {
      await camera.current?.stop();
    }

    const virtualBackground =
      await videoProcessor.current.createVirtualBackgroundStream({
        videoElementId,
        canvasElementId,
        image,
        frameRate: 20,
      });

    virtualBackground?.camera?.start();
    camera.current = virtualBackground.camera;

    if (virtualBackground.canvasVideoTrack) {
      return virtualBackground.canvasVideoTrack;
    }
    return videoTrack;
  } else {
    if (
      !videoProcessor.current ||
      !videoProcessor.current.isVideoProcessorActived()
    ) {
      videoProcessor.current = new VideoProcessor();
    }

    if (camera.current) {
      await camera.current?.stop();
    }

    const gaussianBlur =
      await videoProcessor.current.createGaussianBlurBackgroundStream({
        videoElementId,
        canvasElementId,
        frameRate: 20,
        blurAmount: 10,
      });

    gaussianBlur?.camera?.start();
    camera.current = gaussianBlur.camera;

    if (gaussianBlur.canvasVideoTrack) {
      return gaussianBlur.canvasVideoTrack;
    }
    return videoTrack;
  }
};
