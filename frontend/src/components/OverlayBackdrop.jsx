export default function OverlayBackdrop({ isVisible, onClose }) {
  return (
    <div
      className={`overlay-backdrop${isVisible ? ' visible' : ''}`}
      onClick={onClose}
      aria-hidden="true"
    />
  );
}
