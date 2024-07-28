import './tabPaint.scss';
import {createSignal, onMount} from 'solid-js';
import Slider from './slider';
import Palette from './palette';
import {i18n} from '../../lib/langPack';

export interface MediaEditorBrushParams {
  color: string,
  type: string,
  size: number
}

const BRUSH_TYPES = ['Pen', 'Arrow', 'Brush', 'Neon', 'Blur', 'Eraser'];

const TabPaint = (props: {changeBrush: (brush: MediaEditorBrushParams) => void}) => {
  const [state, setState] = createSignal({
    color: '#FFFFFF',
    type: BRUSH_TYPES[0],
    size: 15
  });
  let list: HTMLElement;

  const onChangeBrush = (prop: any) => {
    const isColorChange = Object.keys(prop)[0] === 'color';

    if(isColorChange) {
      onChangeColor(prop?.color || state().color);

      setState({...state(), ...prop});
      props.changeBrush(state());
      return;
    }

    setState({...state(), ...prop});
    props.changeBrush(state());

    onChangeColor(prop?.color || state().color);
  }

  const [svgContent, setSvgContent]= createSignal<{[k: string]: string}[]>([]);

  const fetchSvg = async(type: string) => {
    const response = await fetch(`../../assets/img/${type.toLowerCase()}.svg`);
    const svgText = await response.text();
    setSvgContent([...svgContent(), {
      [type]: svgText,
      type
    }]);
  };

  const onChangeColor = (selectedColor: string) => {
    const svg = list.querySelector('li.media-editor-selected svg');

    if(svg) {
      const elements = svg.querySelectorAll(`[fill="white"], [fill="${state().color}"], [stroke="white"], [stroke="${state().color}"]`);

      elements.forEach(element => {
        element.setAttribute('fill', selectedColor);
        element.setAttribute('stroke', selectedColor);
      });
    }
  };

  const getBrushesSvg = () => {
    BRUSH_TYPES.forEach(brush => fetchSvg(brush));
  }

  onMount(() => {
    getBrushesSvg();
    props.changeBrush(state());
  })

  return (
    <div class="media-editor-tab-paint">
      <Palette colorChange={(color: string) => onChangeBrush({color})}/>

      <div class="media-editor-brush-size">
        <Slider name="size" min={0} max={30} value={state().size} isDefaultValueColor={true} progressLineColor={state().color} onChange={onChangeBrush}/>
      </div>
      <div>
        <div class="media-editor-tab-paint-title media-editor-label">{i18n('Tool')}</div>
        <ul class="media-editor-brush-tools" ref={el => (list = el!)}>
          {BRUSH_TYPES.map((type: string) => (
            <li class="media-editor-brush" classList={{'media-editor-selected': type === state().type}} onClick={() => onChangeBrush({type})}>
              <span innerHTML={svgContent()?.find(elem => elem.type === type)?.[type]}></span>
              <span>{type}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TabPaint;
