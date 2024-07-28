import './colorPicker.scss';
import {createEffect, createSignal, onCleanup, onMount} from 'solid-js';
import {getRGBfromHEX} from './lib';

const ColorPicker = (props: {baseColor: string, changeColor: (color: string) => void}) => {
  const [colorHex, setColorHex] = createSignal('#ffffff');
  const [colorRGB, setColorRgb] = createSignal('255, 255, 255');
  const [thumbPosition, setThumbPosition] = createSignal({x: 100, y: 60});
  const [isDragging, setIsDragging] = createSignal(false);

  let canvas: HTMLCanvasElement;
  let colorPicker: HTMLDivElement;

  const onMouseDown = (event: MouseEvent) => {
    setIsDragging(true);
    updateThumbPosition(event);
  };

  const onMouseMove = (event: MouseEvent) => {
    if(isDragging()) {
      updateThumbPosition(event);
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const updateThumbPosition = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setThumbPosition({x, y});
    updatePickedColor(x, y);
  };

  const updatePickedColor = (x: number, y: number) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = imageData;
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    const rgb = `${r}, ${g}, ${b}`;
    setColorHex(hex);
    setColorRgb(rgb)
    props.changeColor(hex);
  };

  const drawGradient = (color: string) => {
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const blackGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    blackGradient.addColorStop(0, 'rgba(0,0,0,0)');
    blackGradient.addColorStop(0.5, 'rgba(0,0,0,0)');
    blackGradient.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = blackGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  createEffect(() => {
    drawGradient(props.baseColor);
    setColorHex(props.baseColor)
    setColorRgb(getRGBfromHEX(props.baseColor));
  });

  onCleanup(() => {
    colorPicker.removeEventListener('mousemove', onMouseMove);
    colorPicker.removeEventListener('mouseup', onMouseUp);
  });

  onMount(() => {
    colorPicker.addEventListener('mousemove', onMouseMove);
    colorPicker.addEventListener('mouseup', onMouseUp);
  })

  return (
    <div class="media-editor-color-picker" ref={(el) => (colorPicker = el)}>
      <div class="media-editor-color-picker-element">
        <canvas
          onMouseDown={onMouseDown}
          ref={(el) => (canvas = el)}
        ></canvas>
        <div class="media-editor-color-picker-element-thumb"
          style={{
            'top': `${thumbPosition().y - 10}px`,
            'left': `${thumbPosition().x - 10}px`,
            'background': colorHex(),
            'border-color': colorHex() === '#ffffff' ? 'black' : 'white'
          }}
        ></div>
      </div>
      <div class="media-editor-color-formats">
        <fieldset class="media-editor-color-formats-field">
          <legend>HEX</legend>
          <div>{colorHex()}</div>
        </fieldset>
        <fieldset class="media-editor-color-formats-field">
          <legend>RGB</legend>
          <div>{colorRGB()}</div>
        </fieldset>
      </div>
    </div>
  );
}

export default ColorPicker;
