import './gradientSlider.scss';
import {createSignal} from 'solid-js';

export const COLORS: string[] = [
  '#FF0000',
  '#FF8A00',
  '#FFE600',
  '#14FF00',
  '#00A3FF',
  '#0500FF',
  '#AD00FF',
  '#FF00C7',
  '#FF0000'
];

const GradientSlider = (props: {colorChange: (color: string) => void}) => {
  const [value, setValue] = createSignal<number>(0);

  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    setValue(value);
    props.colorChange(calculateColor(value));
  };

  const calculateColor = (value: number): string => {
    const normalizedValue = value / 100;
    const segment = normalizedValue !== 1 ? Math.floor(normalizedValue * (COLORS.length - 1)) : 7;
    const segmentPercentage = (normalizedValue - segment / (COLORS.length - 1)) * (COLORS.length - 1);
    const startColor = COLORS[segment];
    const endColor = COLORS[segment + 1];
    const startR = parseInt(startColor.slice(1, 3), 16);
    const startG = parseInt(startColor.slice(3, 5), 16);
    const startB = parseInt(startColor.slice(5, 7), 16);
    const endR = parseInt(endColor.slice(1, 3), 16);
    const endG = parseInt(endColor.slice(3, 5), 16);
    const endB = parseInt(endColor.slice(5, 7), 16);
    const interpolatedR = Math.round(startR + segmentPercentage * (endR - startR));
    const interpolatedG = Math.round(startG + segmentPercentage * (endG - startG));
    const interpolatedB = Math.round(startB + segmentPercentage * (endB - startB));
    return `#${interpolatedR.toString(16).padStart(2, '0')}${interpolatedG.toString(16).padStart(2, '0')}${interpolatedB.toString(16).padStart(2, '0')}`;
  };

  return (
    <input
      type="range"
      min="0"
      max="100"
      value={value()}
      class='media-editor-gradient-slider'
      onInput={handleInput}
      style={{
        '--thumb-background': calculateColor(value()),
        'background': `linear-gradient(to right, ${COLORS.join(', ')})`
      }}
    />
  );
};

export default GradientSlider;
