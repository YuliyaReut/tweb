import './slider.scss';
import {createSignal} from 'solid-js';

export interface MediaEditorSliderParams {
  isDefaultValueColor?: boolean,
  progressLineColor?: string,
  name: string,
  min: number,
  max: number,
  value: number,
  onChange: (update: { [key: string]: number }) => void
}

const Slider = (props: MediaEditorSliderParams) => {
  const [sliderValue, setSliderValue] = createSignal(props.value || 0);
  const [progressValue, setProgressValue] = createSignal((props.value / props.max) * 100);

  const onInput = (event: Event) => {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    setSliderValue(value);
    setProgressValue((value / props.max) * 100);
    props.onChange({[props.name]: value});
  };

  const getCapitalizedName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  function calculateProgressStyle() {
    if(props.min === 0) {
      return {
        display: 'none'
      }
    }

    let progressWidth = sliderValue() * 0.5;

    if(sliderValue() < 0) {
      progressWidth *= -1;
    }

    if(progressWidth >= 47 || progressWidth <= -47) {
      progressWidth = 47;
    }
    return {
      width: `${progressWidth}%`,
      [sliderValue() >= 0 ? 'left' : 'right']: `calc(50% + ${progressWidth * 0.5}%)`,
      transform: `translateX(${sliderValue() >= 0 ? '-50%' : '50%'})`
    };
  }

  return (
    <div class="media-editor-slider-container">
      <div class="media-editor-slider-header">
        <label class="media-editor-label" for={props.name}>{getCapitalizedName(props.name)} </label>
        <span
          class="media-editor-slider-result"
          style={{'--resultTextColor': sliderValue() !== 0 && !props.isDefaultValueColor ? '#4E8EE5' : '#AAAAAA'}}>{sliderValue()}</span>
      </div>
      <div class="media-editor-slider-wrapper">
        <input
          type="range"
          id={props.name}
          min={props.min}
          max={props.max}
          value={sliderValue()}
          onInput={onInput}
          style={props.min === 0 && {
            '--progressLineColor': props.progressLineColor || '#4E8EE5',
            'background': `linear-gradient(to right, var(--progressLineColor) ${progressValue()}%, rgba(170, 170, 170, 0.1) ${progressValue()}%)`
          }}
        />
        <div class="media-editor-progress" style={calculateProgressStyle()}></div>
      </div>
    </div>
  );
};

export default Slider;
