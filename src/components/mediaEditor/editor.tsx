import './editor.scss';
import {JSX, children, createEffect, createSignal, onCleanup, onMount} from 'solid-js';
import {render} from 'solid-js/web';
import Navbar from './navbar';
import TabsBar from './tabsBar';
import TabFilters, {MediaEditorFilters} from './tabFilters';
import TabStickers from './tabStickers';
import TabText, {MediaEditorTextParams} from './tabText';
import TabPaint, {MediaEditorBrushParams} from './tabPaint';
import {getRGBfromHEX, throttle} from './lib';
import {createProgram, createShader, fragmentShaderSource, positions, texCoords, vertexShaderSource} from './webgl';
import {IconTsx} from '../iconTsx';

interface TextField {
  id: number,
  text: string,
  x: number,
  y: number,
  editing: boolean,
  format: MediaEditorTextParams
}

interface Sticker {
  id: number,
  text: string,
  x: number,
  y: number,
  editing: boolean,
  element: HTMLElement
}

const MediaEditor = (props: {imgUrl: string, saveChanges: (url: string) => void}) => {
  const [text, setText] = createSignal({color: '#ffffff', size: 24, font: 'Roboto', frame: 'frame_noframe', align: 'left'});
  const [brush, setBrush] = createSignal({color: '#ffffff', size: 10, type: 'Pen'});
  const [selectedTab, setSelectedTab] = createSignal(0);
  const [textFields, setTextFields] = createSignal<TextField[]>([]);
  const [stickers, setStickers] = createSignal<Sticker[]>([]);

  let drawingCanvas: HTMLCanvasElement | undefined;
  let backgroundCanvas: HTMLCanvasElement | undefined;
  let filtersCanvas: HTMLCanvasElement | undefined;
  let drawingCtx: CanvasRenderingContext2D | null = null;
  let backgroundCtx: CanvasRenderingContext2D | null = null;
  let parent: HTMLDivElement | undefined;
  let wrapper: HTMLDivElement | undefined;
  let mediaEditor: HTMLDivElement | undefined;
  const img = new Image();
  let gl: WebGLRenderingContext;
  let vertexShader: WebGLShader;
  let fragmentShader: WebGLShader;
  let program: WebGLProgram;
  let positionLocation: any;
  let texCoordLocation: any;
  let positionBuffer: WebGLBuffer;
  let texCoordBuffer: WebGLBuffer;
  let texture: WebGLTexture;

  const loadImage = () => {
    gl =  filtersCanvas.getContext('webgl') || filtersCanvas.getContext('experimental-webgl') as WebGLRenderingContext;
    vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = createProgram(gl, vertexShader, fragmentShader);
    positionLocation = gl.getAttribLocation(program, 'a_position');
    texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    positionBuffer = gl.createBuffer();
    texCoordBuffer = gl.createBuffer();
    texture = gl.createTexture();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    if(!gl) {
      console.log('Your browser does not support WebGL');
    }
    img.src = props.imgUrl!;
    img.onload = () => {
      initWebGl();
      initGraphCanvas();
    };
  };

  const initWebGl = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    throttledApplyEffects({
      enhance: 0,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      fade: 0,
      highlights: 0,
      shadows: 0,
      vignette: 0,
      grain: 0,
      sharpen: 0
    });
  }

  const initGraphCanvas = () => {
    const aspectRatio = img.width / img.height;
    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;
    let width = parentWidth;
    let height = parentWidth / aspectRatio;
    if(parentWidth / parentHeight > aspectRatio) {
      width = parentHeight * aspectRatio;
      height = parentHeight;
    }

    const canvases = [backgroundCanvas, drawingCanvas, filtersCanvas];
    canvases.forEach(canvas => {
      canvas.height = height;
      canvas.width = width;
    });

    wrapper.style.height = backgroundCanvas.clientHeight + 'px';
    wrapper.style.width = backgroundCanvas.clientWidth + 'px';

    drawingCtx = drawingCanvas.getContext('2d');
    backgroundCtx = backgroundCanvas.getContext('2d');

    if(backgroundCtx) {
      backgroundCtx.drawImage(img, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
    }
  }

  const renderWebGLCanvas = (filters: MediaEditorFilters) => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);

    Object.keys(filters).forEach((key: string) => {
      const filterKey = key as keyof MediaEditorFilters;
      gl.uniform1f(gl.getUniformLocation(program, `u_${key}`), filters[filterKey]);
    })

    gl.uniform2f(gl.getUniformLocation(program, 'u_textureSize'), backgroundCanvas.width, backgroundCanvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const setUpCanvasListeners = () => {
    let x1: number;
    let y1: number;
    let isPainting = false;

    const startPosition = (e: MouseEvent) => {
      const isCanvas = (e.target as HTMLElement).tagName.toLowerCase() !== 'canvas';
      const isNotPaintTab = selectedTab() !== 3;

      if(isCanvas || isNotPaintTab) return;

      isPainting = true;
      x1 = e.clientX - (drawingCanvas?.getBoundingClientRect().left || 0);
      y1 = e.clientY - (drawingCanvas?.getBoundingClientRect().top || 0);
      draw(e);
    };

    const finishedPosition = (e: MouseEvent) => {
      const isCanvas = (e.target as HTMLElement).tagName.toLowerCase() !== 'canvas';
      const isNotPaintTab = selectedTab() !== 3;

      if(isCanvas || isNotPaintTab) return;

      isPainting = false;
      if(brush().type === 'Arrow') {
        const x2 = e.clientX - (drawingCanvas?.getBoundingClientRect().left || 0);
        const y2 = e.clientY - (drawingCanvas?.getBoundingClientRect().top || 0);
        drawArrow(x1, y1, x2, y2);
      }

      drawingCtx.beginPath();
    };

    const draw = (e: MouseEvent) => {
      if(selectedTab() !== 3) return;
      if((e.target as HTMLElement).tagName.toLowerCase() !== 'canvas') return;
      if(!isPainting || !drawingCtx || !drawingCanvas) return;

      const rect = drawingCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      drawingCtx.globalCompositeOperation = 'source-over';
      drawingCtx.lineWidth = brush().size;

      if(brush().type === 'Pen' || brush().type === 'Arrow') {
        drawingCtx.strokeStyle = brush().color;
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';
        drawingCtx.lineWidth = brush().size;
        drawingCtx.shadowColor = 'none';
        drawingCtx.shadowBlur = 0;
      }

      if(brush().type === 'Brush') {
        drawingCtx.strokeStyle = `rgba(${getRGBfromHEX(brush().color)}, 0.1)`;
        drawingCtx.lineCap = 'square';
        drawingCtx.lineJoin = 'bevel';
        drawingCtx.lineWidth = brush().size;
        drawingCtx.shadowColor = 'none';
        drawingCtx.shadowBlur = 0;
      }

      if(brush().type === 'Neon') {
        drawingCtx.strokeStyle = `rgba(${getRGBfromHEX('#ffffff')}, 1)`;
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';
        drawingCtx.lineWidth = brush().size + 10;
        drawingCtx.shadowColor = brush().color;
        drawingCtx.shadowBlur = 20;
      }

      if(brush().type === 'Blur') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = drawingCanvas.width;
        tempCanvas.height = drawingCanvas.height;
        tempCtx.drawImage(backgroundCanvas, 0, 0);

        drawingCtx.strokeStyle = 'transparent';
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';
        drawingCtx.lineWidth = brush().size + 10;
        drawingCtx.shadowColor = brush().color;
        drawingCtx.shadowBlur = 0;
        drawingCtx.save();
        drawingCtx.beginPath();
        drawingCtx.arc(x, y, brush().size, 0, Math.PI * 2, false);
        drawingCtx.clip();
        drawingCtx.filter = 'blur(10px)';
        drawingCtx.drawImage(tempCanvas, 0, 0);
        drawingCtx.filter = 'none';

        drawingCtx.restore();
      }

      if(brush().type === 'Eraser') {
        drawingCtx.globalCompositeOperation = 'destination-out';
        drawingCtx.lineCap = 'butt';
        drawingCtx.strokeStyle = 'rgba(0,0,0,0)';
        drawingCtx.clearRect(x, y, brush().size, brush().size);
      }

      drawingCtx.fillStyle = 'rgba(0,0,0,1)';
      drawingCtx.beginPath();
      drawingCtx.moveTo(x, y);
      drawingCtx.lineTo(x, y);
      drawingCtx.stroke();
    };

    const drawArrow = (x1: number, y1: number, x2: number, y2: number) => {
      let {size} = brush() ;
      size = size * 2;
      const headAngle = Math.PI / 6;

      const angle = Math.atan2(y2 - y1, x2 - x1);

      const leftX = x2 - size * Math.cos(angle - headAngle);
      const leftY = y2 - size * Math.sin(angle - headAngle);
      const rightX = x2 - size * Math.cos(angle + headAngle);
      const rightY = y2 - size * Math.sin(angle + headAngle);

      drawingCtx.beginPath();
      drawingCtx.moveTo(x2, y2);
      drawingCtx.lineTo(leftX, leftY);
      drawingCtx.moveTo(x2, y2);
      drawingCtx.lineTo(rightX, rightY);
      drawingCtx.stroke();
    };

    drawingCanvas.addEventListener('mousedown', startPosition);
    drawingCanvas.addEventListener('mouseup', finishedPosition);
    drawingCanvas.addEventListener('mousemove', draw);

    onCleanup(() => {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      drawingCanvas.removeEventListener('mousedown', startPosition);
      drawingCanvas.removeEventListener('mouseup', finishedPosition);
      drawingCanvas.removeEventListener('mousemove', draw);
    });
  }

  onMount(() => {
    loadImage();
    setUpCanvasListeners();
  });

  const onClose = () => {
    mediaEditor.parentElement.removeChild(mediaEditor);
  };

  const onUndo = () => {
    // TODO:
  };

  const onRedo = () => {
    // TODO:
  };

  const onSelectTab = (index: number) => {
    setSelectedTab(index);
  }

  const onChangeFilters = (filters: MediaEditorFilters) => {
    throttledApplyEffects(filters);
  }

  const throttledApplyEffects = throttle((filters: any) => {
    renderWebGLCanvas(filters);
  });

  const onChangeBrush = (brush: MediaEditorBrushParams) => {
    setBrush(brush);
  }

  const onChangeText = (text: MediaEditorTextParams) => {
    setText(text);
    const activeTextFieldId = parent.querySelector('.media-editor-active')?.id;
    const isTextField = parent.querySelector('.media-editor-active')?.classList.contains('media-editor-text-field');
    if(activeTextFieldId && isTextField) {
      const idx = textFields().findIndex(field => +field.id === +activeTextFieldId);
      textFields()[idx].format = text;
      setTextFields([...textFields()]);
    }
  }

  const onSelectSticker = (element: HTMLElement) => {
    setStickers([...stickers().map((sticker) => {
      sticker.editing = false;
      return sticker;
    }), {
      id: Date.now(),
      x: 0,
      y: 0,
      editing: true,
      element
    } as Sticker]);
  }

  const renderTab= () => {
    switch(selectedTab()) {
      case 0:
        return (
          <TabFilters onChange={onChangeFilters}/>
        );
      case 2:
        return (
          <TabText changeText={onChangeText}/>
        );
      case 3:
        return (
          <TabPaint changeBrush={onChangeBrush}/>
        );
      case 4:
        return (
          <TabStickers selectSticker={onSelectSticker}/>
        );
    }
  };

  const getMergedCanvases = () => {
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = backgroundCanvas.width;
    resultCanvas.height = backgroundCanvas.height;
    const resultCtx = resultCanvas.getContext('2d');

    resultCtx.drawImage(backgroundCanvas, 0, 0);
    resultCtx.drawImage(filtersCanvas, 0, 0);
    resultCtx.drawImage(drawingCanvas, 0, 0);

    // TODO: add merge with stickers and text fields
    return resultCanvas.toDataURL('image/png');
  }

  const handleCanvasClick = (e: Event) => {
    const activeTextField = parent.querySelector('.media-editor-active');
    const isTextFieldActive = activeTextField?.classList.contains('media-editor-text-field');
    const target = e.target as HTMLElement;
    const isTargetTextField = target.classList.contains('media-editor-text-field');
    const isTargetActive = target.classList.contains('media-editor-active');
    const checkIdCb = (entity: Sticker | TextField) => +entity.id === +activeTextField?.id;

    // set active state
    if(selectedTab() === 2) {
      if(!isTargetTextField && !activeTextField) {
        addTextField((e as any).clientX, (e as any).clientY);
      }

      if(isTargetActive) {
        if(isTextFieldActive) {
          const idx = textFields().findIndex(checkIdCb);
          textFields()[idx].editing = true;
          setTextFields([...textFields()]);
          return;
        }
        const idx = stickers().findIndex(checkIdCb);
        stickers()[idx].editing = true;
        setStickers([...stickers()]);
      }
    }

    // remove active state
    if(activeTextField) {
      if(isTextFieldActive) {
        const idx = textFields().findIndex(checkIdCb);
        textFields()[idx].editing = false;
        setTextFields([...textFields()]);
      } else {
        const idx = stickers().findIndex(checkIdCb);
        stickers()[idx].editing = false;
        setStickers([...stickers()]);
      }
    }
  }

  const addTextField = (x: number, y: number) => {
    setTextFields([...textFields(), {
      id: Date.now(),
      text: 'Enter your text here',
      x,
      y,
      editing: true,
      format: text()
    } as TextField]);
  };

  const onChangeTextField = (e: any) => {
    const idx = textFields().findIndex(field => +field.id === +e.id);
    textFields()[idx] = {...e};
  }

  const onChangeSticker = (e: any) => {
    const idx = stickers().findIndex(field => +field.id === +e.id);
    stickers()[idx] = {...e};
  }

  const onSaveChanges = () => {
    props.saveChanges(getMergedCanvases());
    onClose();
  }

  return (
    <div class='media-editor' ref={el => (mediaEditor = el!)}>
      <div class='media-editor-image-container' ref={el => (parent = el!)}>
        <div class='media-editor-elements-wrapper' ref={el => (wrapper = el!)}>
          <canvas id="backgroundCanvas" ref={el => (backgroundCanvas = el!)} />
          <canvas id="filtersCanvas" ref={el => (filtersCanvas = el!)} />
          <canvas id="drawingCanvas" ref={el => (drawingCanvas = el!)} onClick={(e) => handleCanvasClick(e)}/>
          {textFields().map(field => (
            <TextField field={field} changeTextField={onChangeTextField} />
          ))}
          {stickers().map(sticker => (
            <Sticker sticker={sticker} changeSticker={onChangeSticker} />
          ))}
        </div>
      </div>
      <div class='media-editor-controls'>
        <div class='media-editor-sticky-header'>
          <Navbar onClose={onClose} onUndo={onUndo} onRedo={onRedo}/>
          <TabsBar selectTab={onSelectTab}/>
        </div>
        <button class="media-editor-save-btn" onClick={onSaveChanges}>
          <IconTsx icon={'check'} />
        </button>
        {renderTab()}
      </div>
    </div>
  );
};

export default MediaEditor;

export const renderMediaEditor = (url:any, onSaveChanges: (data: any) => void) => {
  render(() => <MediaEditor imgUrl={url} saveChanges={onSaveChanges}/>, document.querySelector('.popup'));
};


// TODO: split on different components TextField, Sticker & CanvasElementWrapper

function TextField(props: {field: TextField, changeTextField: (field: TextField) => void}): JSX.Element {
  const [field, setField] = createSignal(props.field);
  let textareaRef: HTMLDivElement | null;

  const handleFocus = () => {
    setField({...field(), editing: true});
    props.changeTextField(field());
  };

  const handleBlur = () => {
    setField({...field(), text: textareaRef.textContent});
    props.changeTextField(field());
  };

  const highlightLines = () => {
    const lines = textareaRef.innerText.split('\n');
    const highlightedHTML = lines.map(line => `<div class="media-editor-frame-white">${line}</div>`).join('');

    textareaRef.innerHTML = highlightedHTML;
  }

  const onChangeTextField = (updatedField: TextField) => {
    setField(updatedField);
    props.changeTextField(field());
  }

  onMount(() => {
    if(field().format.frame === 'frame_white') {
      highlightLines();
    }
  })

  return (
    <CanvasElementWrapper element={field()} changeElement={onChangeTextField}>
      <div
        id={field().id.toString()}
        ref={el => textareaRef = el}
        class="media-editor-text-field"
        contentEditable={true}
        classList={{
          'media-editor-active': field().editing,
          'media-editor-frame-black': field().format.frame === 'frame_black'
        }}
        style={{
          '--text-font-size': `${field().format.size}px`,
          '--text-color': field().format.color,
          '--text-align': field().format.align,
          'font-family': field().format.font
        }}
        onClick={handleFocus}
        onBlur={handleBlur}
      >
        {field().text}
      </div>
    </CanvasElementWrapper>
  );
}

function Sticker(props: {sticker: Sticker, changeSticker: (updatedSticker: Sticker) => void}): JSX.Element {
  const [sticker, setSticker] = createSignal<Sticker>(props.sticker);

  const handleFocus = () => {
    setSticker({...sticker(), editing: true});
    props.changeSticker(sticker());
  };

  const handleBlur = () => {
    setSticker({...sticker(),  editing: false});
    props.changeSticker(sticker());
  };

  const onChangeSticker = (updatedSticker: Sticker) => {
    setSticker(updatedSticker);
    props.changeSticker(sticker());
  }

  return (
    <CanvasElementWrapper element={sticker()} changeElement={onChangeSticker}>
      <div
        id={sticker().id.toString()}
        class="media-editor-sticker"
        classList={{
          'media-editor-active': sticker().editing
        }}
        onClick={handleFocus}
        onBlur={handleBlur}
      >
        {sticker().element}
      </div>
    </CanvasElementWrapper>
  );
}

function CanvasElementWrapper(props: {element: Sticker | TextField, children: any, changeElement: (item: any) => void}): JSX.Element {
  const [element, setElement] = createSignal(props.element);

  let containerRef: HTMLDivElement | null;

  let initialMouseX: number, initialMouseY: number;
  let isDragging: boolean = false;
  let x:number, y:number;

  const onMouseDown = (event: MouseEvent) => {
    isDragging = true;
    initialMouseX = event.clientX - containerRef.offsetLeft;
    initialMouseY = event.clientY - containerRef.offsetTop;
  }

  const onMouseMove = (event: MouseEvent) => {
    if(!isDragging) return;
    x = event.clientX - initialMouseX;
    y = event.clientY - initialMouseY;
    containerRef.style.left = x + 'px';
    containerRef.style.top = y + 'px';
  }

  const onMouseUp = (_event: MouseEvent) => {
    isDragging = false;
    if(x && y) {
      setElement({...element(), x, y});
      props.changeElement(element());
    }
  }

  const c = children(() => props.children);

  createEffect(() => {
    setElement(props.element);
  })

  return (
    <div
      class="media-editor-element-container media-editor-element"
      ref={el => containerRef = el}
      style={{
        'left': `${element().x}px`, 'top': `${element().y}px`
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div style={{display: 'flex'}}>
        {c()}
        {
          ['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((angleCssClass: string) => (
            <div class={`rotate-handle ${angleCssClass}`} style={{display: element().editing ? 'block' : 'none'}}></div>
          ))
        }
      </div>
    </div>
  );
}
