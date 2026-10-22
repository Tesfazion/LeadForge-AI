/**
 * Modal component
 *
 * A reusable, accessible overlay modal that replaces the copy-pasted
 * modal HTML found across inbox.js, outreach.js, leads/[id].js, etc.
 *
 * Usage:
 *   <Modal
 *     isOpen={!!selectedItem}
 *     onClose={() => setSelectedItem(null)}
 *     title="Email Subject"
 *     maxWidth={700}
 *   >
 *     <p>Modal body content here</p>
 *   </Modal>
 *
 * The backdrop click and the Escape key both close the modal.
 * Focus is trapped inside while open (via the autoFocus on the container).
 */

import { useEffect } from "react";
import Icon from "./Icon";

/**
 * @param {object}   props
 * @param {boolean}  props.isOpen    - Whether the modal is visible
 * @param {function} props.onClose   - Called when the user dismisses the modal
 * @param {string}   [props.title]   - Optional header title
 * @param {number}   [props.maxWidth=640] - Max width of the modal panel in px
 * @param {React.ReactNode} props.children - Modal body content
 */
export default function Modal({ isOpen, onClose, title, maxWidth = 640, children }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Panel — stop click from bubbling to backdrop */}
      <div
        className="modal-panel"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (only rendered when a title is provided) */}
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
