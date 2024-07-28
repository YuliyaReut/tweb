import './palette.scss';
import ColorPicker from './colorPicker';
import GradientSlider, {COLORS} from './gradientSlider';
import {getRGBfromHEX} from './lib';
import {createSignal} from 'solid-js';

const COLORS_TAB = ['#FFFFFF', '#FE4438', '#FF8901', '#FFD60A', '#33C759', '#62E5E0', '#0A84FF', '#BD5CF3'];
const ALL_COLORS_TAB = COLORS_TAB.concat('palette');

const Palette = (props: {colorChange: (color: string) => void}) => {
  const [selectedColorTab, setSelectedColorTab] = createSignal('#FFFFFF');
  const [isPaletteOpened, setIsPaletteOpened] = createSignal(false);
  const [baseColor, setBaseColor] = createSignal(COLORS_TAB[0]);

  const handleColorClick = (color: string) => {
    if(color === 'palette') {
      if(isPaletteOpened()) {
        setIsPaletteOpened(false);
      } else {
        setIsPaletteOpened(true);
        props.colorChange(COLORS[0]);
        setBaseColor(COLORS[0]);
      }
    } else {
      props.colorChange(color);
      setBaseColor(color);
    }

    if(ALL_COLORS_TAB.includes(color)) {
      setSelectedColorTab(color);
    }
  };

  return (
    <div class="media-editor-palette">
      <div class="media-editor-palette-colors">
        {!isPaletteOpened() ? COLORS_TAB.map((colorTab) => (
          <button
            class="media-editor-palette-button"
            classList={{'media-editor-selected': colorTab === selectedColorTab()}}
            style={{
              'background': colorTab,
              '--selected-border-color': `rgba(${getRGBfromHEX(colorTab)}, .5)`
            }}
            onClick={() => handleColorClick(colorTab)}
          />
        )) : <GradientSlider colorChange={handleColorClick}/>}
        <button
          class="media-editor-palette-button"
          classList={{'media-editor-selected media-editor-selected-palette': 'palette' === selectedColorTab()}}
          style={{
            'background': 'url("../../assets/img/palette.png")',
            '--selected-border-color': `rgba(${getRGBfromHEX('#2B2B2B')}, 0.7)`

          }}
          onClick={() => handleColorClick('palette')}
        />
      </div>

      {isPaletteOpened() && (
        <ColorPicker baseColor={baseColor()} changeColor={handleColorClick} />
      )}
    </div>
  );
};

export default Palette;
