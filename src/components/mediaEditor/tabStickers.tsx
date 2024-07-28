import './tabStickers.scss';
import {onMount} from 'solid-js';
import rootScope from '../../lib/rootScope';
import {Document, MessagesAllStickers} from '../../layer';
import {getMiddleware} from '../../helpers/middleware';
import wrapSticker from '../wrappers/sticker';
import {MyDocument} from '../../lib/appManagers/appDocsManager';
import LazyLoadQueueRepeat from '../lazyLoadQueueRepeat';
import {AnimationIntersector} from '../animationIntersector';
import mediaSizes from '../../helpers/mediaSizes';

const TabStickers = (props: {selectSticker: (sticker: HTMLElement) => void}) => {
  const stickers: { sticker: Document.document; id: string }[] = [];
  const animationIntersector = new AnimationIntersector();
  let intersectionObserverInit: IntersectionObserverInit;
  let wrapper: HTMLDivElement;

  const lazyLoadQueue = new LazyLoadQueueRepeat(undefined, ({target, visible}) => {
    if(!visible) {
      processInvisible(target);
    }
  }, intersectionObserverInit);

  onMount(() => {
    rootScope.managers.appStickersManager.getAllStickers().then((res) => {
      for(const set of (res as MessagesAllStickers.messagesAllStickers).sets) {
        rootScope.managers.appStickersManager.getStickerSet(set).then((stickerSet) => {
          const container = document.createElement('div');
          container.classList.add('emoji-category');

          let title: HTMLElement;
          if(stickerSet.set.title) {
            title = document.createElement('div');
            title.classList.add('category-title');
            title.append(stickerSet.set.title);
          }

          const items = document.createElement('div');
          items.classList.add('category-items', 'super-stickers');
          (stickerSet.documents as MyDocument[]).forEach((sticker) => {
            const element = document.createElement('div');
            element.classList.add('grid-item', 'super-sticker');
            element.dataset.docId = '' + sticker.id;

            wrapStickerPrivate(element, sticker);

            items.appendChild(element);
            return element;
          });

          container.append(title);
          container.append(items);
          wrapper.append(container);
        })
      }
    })
  })

  const wrapStickerPrivate = (element: HTMLElement, sticker: Document.document) => {
    if(sticker.animated) {
      observeAnimated(element);
    }

    const elementId = 'sticker'+sticker.id;
    element.id = elementId;

    stickers.push({
      sticker,
      id: elementId
    })

    element.middlewareHelper = getMiddleware();
    wrapSticker({
      doc: sticker,
      div: element,
      onlyThumb: sticker.animated,
      middleware: element.middlewareHelper.get()
    });
  }

  const observeAnimated = (element: HTMLElement) => {
    lazyLoadQueue.observe({
      div: element,
      load: processVisible
    });
  }

  const processInvisible = async(element: HTMLElement) => {
    const docId = element.dataset.docId;
    const doc = await rootScope.managers.appDocsManager.getDoc(docId);

    checkAnimationContainer(element, false);

    element.middlewareHelper?.clean();
    element.replaceChildren();
    element.middlewareHelper = getMiddleware();
    wrapSticker({doc, div: element, onlyThumb: doc.animated, middleware: element.middlewareHelper.get()});
  };

  const processVisible = async(element: HTMLElement) => {
    const docId = element.dataset.docId;
    const doc = await rootScope.managers.appDocsManager.getDoc(docId);
    const size = mediaSizes.active.esgSticker.width;

    element.middlewareHelper ??= getMiddleware();
    element.middlewareHelper.clean();

    const promise = wrapSticker({
      doc,
      div: element,
      width: size,
      height: size,
      lazyLoadQueue: null,
      onlyThumb: false,
      play: true,
      loop: true,
      withLock: true,
      middleware: element.middlewareHelper.get(),
      ...({})
    }).then(({render}) => render);

    promise.then((res) => {
      checkAnimationContainer(element, lazyLoadQueue.intersector.isVisible(element));
    }, noop);

    return promise;
  };

  const checkAnimationContainer = (element: HTMLElement, visible: boolean) => {
    const players = animationIntersector.getAnimations(element);
    players.forEach((player) => {
      if(!visible) {
        animationIntersector.removeAnimation(player);
      } else {
        animationIntersector.checkAnimation(player, false);
      }
    });
  };

  const onClick = (event: Event) => {
    const idx = stickers.findIndex((elemt) => elemt.id === (event.target as HTMLElement).parentElement.id);
    const element = document.createElement('div');
    element.dataset.docId = '' + stickers[idx].sticker.id;

    wrapStickerPrivate(element, stickers[idx].sticker);

    props.selectSticker(element);
  }

  return (
    <div class="media-editor-tab-stickers emoticons-content">
      <div class="scrollable scrollable-y emoticons-will-move-up">
        <div ref={el => (wrapper = el!)} onClick={onClick} class="emoticons-categories-container emoticons-will-move-down emoticons-has-search animated-item">
        </div>
      </div>
    </div>
  )
}

export default TabStickers;

function noop() {}
