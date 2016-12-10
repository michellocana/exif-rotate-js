import EXIF from 'exif-js';
import { max_size, default_container_id } from './configs';
import ImageDoc from './image';
const image_doc = new ImageDoc();

export default class makeCanvas {
  /**
  *  @param img {elem}
  *  @param canvas {elem}
  *  @param ctx {canvas obj}
  *  @param options {object}
  */
  static setCanvas(files, canvas, ctx, options) {
    return new Promise((resolve, reject) => {
      image_doc.readFile(files)
      .then((file) => {
        // return file;

        image_doc.setImage(file)
        .then((img) => {
          img.re_width = img.width;
          img.re_height = img.height;
          const orientation = getOrientation(img);
          if (orientation === 6) {
            // 縦画像だった場合スマートフォンでは幅・高さは横画像と認識されるため、 width height を手動で入れ替える必要あり
            img.re_height = img.width;
            img.re_width = img.height;
          }

          canvasResizeAndDrawImage(img, canvas, ctx, options);

          return resolve(rotateFromOrientation(orientation, img, ctx, canvas));
        })
        .catch((error) => {
          console.log(error);
        });
      })
      .catch((error) => {
        console.log(error);
      });
    })
  }

  /**
  *  draw image on canvas
  *  @param img {elem}
  *  @param canvas {elem}
  *  @param ctx {canvas obj}
  */
  static canvasResizeAndDrawImage(img, canvas, ctx, options) {
    const size = options.max_size ? options.max_size : max_size;

    if (img.re_width > img.re_height) {
      const resize = img.re_height * (size / img.re_width);
      canvas.width = size;
      canvas.height = resize;
      ctx.drawImage(img, 0, 0, size, resize);
    } else if (img.re_height > img.re_width) {
      const resize = img.re_width * (size / img.re_height);
      canvas.width = resize;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, resize, size);
    } else {
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
    }
  }

  /**
  *  get orientation for mobile
  *  @param img {elem}
  */
  static getOrientation(img) {
    let orientation;
    EXIF.getData(img, () => {
      orientation = EXIF.getTag(img, 'Orientation');
    });
    return orientation;
  }

  /**
  *  append container
  *  @param canvas {elem}
  */
  static appendNewImage(canvas, options) {
    const base_64 = canvas.toDataURL('image/jpeg');
    const new_img = new Image();
    new_img.setAttribute('src', base_64);
    const id = options.container_id ? options.container_id : default_container_id;
    const container = document.getElementById(id);
    return container.appendChild(new_img);
  }

  /**
  *  for mobile
  *  orientation があった場合に正しい角度で見せるように canvas を使って回転させる
  *  @param orientation {number}
  *  @param img {elem}
  *  @param ctx {canvas obj}
  *  @param canvas {elem}
  */
  static rotateFromOrientation(orientation, img, ctx, canvas) {
    switch (orientation) {
      case 2:
        // horizontal flip
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        break;
      case 3:
        // 180° rotate left
        ctx.translate(canvas.width, canvas.height);
        ctx.rotate(Math.PI);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        break;
      case 4:
        // vertical flip
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
        break;
      case 5:
        // vertical flip + 90 rotate right
        ctx.rotate(0.5 * Math.PI);
        ctx.scale(1, -1);
        break;
      case 6: {
        // 90° rotate right
        ctx.rotate(0.5 * Math.PI);
        ctx.translate(0, -canvas.height);
        const img_ratio = (img.re_height / img.re_width) - 1;
        ctx.drawImage(img, 0, canvas.width * img_ratio, canvas.height, canvas.width);
      }
        break;
      case 7:
        // horizontal flip + 90 rotate right
        ctx.rotate(0.5 * Math.PI);
        ctx.translate(canvas.width, -canvas.height);
        ctx.scale(-1, 1);
        break;
      case 8:
        // 90° rotate left
        ctx.rotate(-0.5 * Math.PI);
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        break;
      default:
        break;
    }
  }
}

export const {
  setCanvas,
  getOrientation,
  canvasResizeAndDrawImage,
  rotateFromOrientation,
  appendNewImage,
} = makeCanvas;