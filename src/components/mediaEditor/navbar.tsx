import './navbar.scss';
import {ButtonIconTsx} from '../buttonIconTsx';
import {i18n} from '../../lib/langPack';

const Navbar = (props: {onClose: () => void, onUndo: () => void, onRedo: () => void}) => {
  const onClose = () => {
    props.onClose();
  };

  const onUndo = () => {
    props.onUndo();
  };

  const onRedo = () => {
    props.onRedo();
  };

  return (
    <div class="media-editor-navbar">
      <ButtonIconTsx
        classList={{'close-btn': true}}
        icon={'close'}
        onClick={onClose}
      />
      <div class="media-editor-navbar-title">{i18n('Edit')}</div>
      <ButtonIconTsx
        classList={{'button': true}}
        icon={'undo'}
        onClick={onUndo}
      />
      <ButtonIconTsx
        classList={{'button': true}}
        icon={'redo'}
        onClick={onRedo}
      />
    </div>
  );
};

export default Navbar;
