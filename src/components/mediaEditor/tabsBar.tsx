import './tabsBar.scss';
import {IconTsx} from '../iconTsx';
import {createSignal} from 'solid-js';

const TabsBar = (props: {selectTab: (index: number) => void}) => {
  const [selectedTab, setSelectedTab] = createSignal(0);
  const tabs = ['enhance', 'crop', 'text', 'brush', 'smile'];

  const onClick = (index: number) => {
    setSelectedTab(index);
    props.selectTab(index);

    const tabsBar = document.querySelector('.media-editor-tabs-bar') as HTMLElement;
    const underline = document.querySelector('.media-editor-underline') as HTMLElement;
    const tab = document.querySelector('.tgico') as HTMLButtonElement;
    const tabWidth = tab.offsetWidth;
    const space = (tabsBar.offsetWidth - (tabWidth * tabs.length)) / tabs.length;
    const newPosition = (space + tabWidth) * index;
    underline.style.transform = `translateX(${newPosition}px)`;
  };

  return (
    <div class="media-editor-tabs">
      <div class="media-editor-tabs-container">
        <div class="media-editor-tabs-bar">
          {tabs.map((tab: string, index: number) => (
            <button class={selectedTab() === index ? 'media-editor-selected' : ''} onClick={() => onClick(index)}>
              <IconTsx icon={tab as Icon}  />
            </button>
          ))}
          <div class="media-editor-underline"></div>
        </div>
      </div>
    </div>
  );
};

export default TabsBar;
