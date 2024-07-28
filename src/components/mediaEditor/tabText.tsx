import './tabText.scss';
import {createSignal, onMount} from 'solid-js';
import Slider from './slider';
import {IconTsx} from '../iconTsx';
import Palette from './palette';
import {i18n} from '../../lib/langPack';

export interface MediaEditorTextParams {
  align: 'left' | 'centre' | 'right',
  font: string,
  frame: 'frame_noframe' | 'frame_black' | 'frame_white',
  size: number,
  color: string
}

const ALIGNS = ['left', 'centre', 'right'];
const FRAMES = ['frame_noframe', 'frame_black', 'frame_white'];
const FONTS = ['Roboto', 'Typewriter', 'Avenir Next', 'Courier New', 'Noteworthy', 'Georgia', 'Papyrus', 'Snell Roundhand']

const TabText = (props: {changeText: (state: MediaEditorTextParams) => void}) => {
  const [state, setState] = createSignal<MediaEditorTextParams>({
    align: 'left',
    font: 'Roboto',
    frame: 'frame_noframe',
    size: 24,
    color: '#FFFFFF'
  });

  const onTextChange = (prop: any) => {
    setState({
      ...state(),
      ...prop
    })
    props.changeText(state());
  }

  const init = () => {
    props.changeText(state());
  }

  onMount(() => {
    init();
  });

  return (
    <div class="media-editor-tab-text">
      <Palette colorChange={(color: string) => onTextChange({color})}/>

      <div class="media-editor-text-tools">
        <div class="media-editor-text-aligns">
          {ALIGNS.map((align) => (
            <button
              class="media-editor-text-tools-button"
              classList={{'media-editor-text-selected': align === state().align}}
              onClick={() => onTextChange({align})}>
              <IconTsx icon={`align_${align}` as Icon}  />
            </button>
          ))}
        </div>

        <div class="media-editor-text-frames">
          {FRAMES.map((frame) => (
            <button
              class="media-editor-text-tools-button"
              classList={{'media-editor-text-selected': frame === state().frame}}
              onClick={() => onTextChange({frame})}>
              <IconTsx icon={frame as Icon}  />
            </button>
          ))}
        </div>
      </div>

      <div class="media-editor-text-size">
        <Slider
          name="size"
          min={0}
          max={48}
          value={state().size}
          isDefaultValueColor={true}
          progressLineColor={state().color}
          onChange={onTextChange}
        />
      </div>

      <div class="media-editor-text-fonts">
        <div class="media-editor-text-fonts-title media-editor-label">{i18n('Font')}</div>
        <ul>
          {FONTS.map((font) => (
            <li
              class="media-editor-text-font-item"
              style={{'font-family': font}}
              classList={{'media-editor-text-selected': font === state().font}}
              onClick={() => onTextChange({font})}>
              {font}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TabText;
