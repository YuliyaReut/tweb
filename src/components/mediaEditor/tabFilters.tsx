import './tabFilters.scss';
import {createSignal} from 'solid-js';
import Slider from './slider';

export interface MediaEditorFilters {
  enhance: number,
  brightness: number,
  contrast: number,
  saturation: number,
  warmth: number,
  fade: number,
  highlights: number,
  shadows: number,
  vignette: number,
  grain: number,
  sharpen: number
}

const TabFilters = (props: any) => {
  const [state, setState] = createSignal<MediaEditorFilters>({
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

  const handleSliderChange = (newValue: any) => {
    setState({...state(), ...newValue});
    props.onChange(state());
  };

  return (
    <div class="media-editor-tab-filters">
      <Slider name="enhance" min={0} max={100} value={state().enhance} onChange={handleSliderChange} />
      <Slider name="brightness" min={-100} max={100} value={state().brightness} onChange={handleSliderChange} />
      <Slider name="contrast" min={-100} max={100} value={state().contrast} onChange={handleSliderChange} />
      <Slider name="saturation" min={-100} max={100} value={state().saturation} onChange={handleSliderChange} />
      <Slider name="warmth" min={-100} max={100} value={state().warmth} onChange={handleSliderChange} />
      <Slider name="fade" min={0} max={100} value={state().fade} onChange={handleSliderChange} />
      <Slider name="highlights" min={-100} max={100} value={state().highlights} onChange={handleSliderChange} />
      <Slider name="shadows" min={-100} max={100} value={state().shadows} onChange={handleSliderChange} />
      <Slider name="vignette" min={0} max={100} value={state().vignette} onChange={handleSliderChange} />
      <Slider name="grain" min={0} max={100} value={state().grain} onChange={handleSliderChange} />
      <Slider name="sharpen" min={0} max={100} value={state().sharpen} onChange={handleSliderChange} />
    </div>
  );
};

export default TabFilters;
