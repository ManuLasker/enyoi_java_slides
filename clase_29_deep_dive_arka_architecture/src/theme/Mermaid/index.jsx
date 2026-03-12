import React, {useEffect, useState} from 'react';
import MermaidOriginal from '@theme-original/Mermaid';
import {TransformComponent, TransformWrapper} from 'react-zoom-pan-pinch';
import styles from './styles.module.css';

function DiagramViewport({children, onRequestFullscreen}) {
  const [isPanning, setIsPanning] = useState(false);

  return (
    <TransformWrapper
      minScale={0.25}
      maxScale={6}
      initialScale={1}
      limitToBounds={false}
      centerOnInit
      wheel={{step: 0.12}}
      pinch={{step: 5}}
      panning={{
        disabled: false,
        velocityDisabled: true,
        allowLeftClickPan: true,
        allowMiddleClickPan: true,
        allowRightClickPan: false,
      }}
      onPanningStart={() => setIsPanning(true)}
      onPanningStop={() => setIsPanning(false)}
      doubleClick={{disabled: true}}>
      {({zoomIn, zoomOut, resetTransform}) => (
        <div className={`${styles.viewer} ${isPanning ? styles.isPanning : ''}`}>
          <div className={styles.controls}>
            <button type="button" onClick={() => zoomIn()} aria-label="Zoom in">
              +
            </button>
            <button type="button" onClick={() => zoomOut()} aria-label="Zoom out">
              -
            </button>
            <button type="button" onClick={() => resetTransform()} aria-label="Reset view">
              Reset
            </button>
            {onRequestFullscreen ? (
              <button
                type="button"
                onClick={onRequestFullscreen}
                aria-label="Open fullscreen">
                Fullscreen
              </button>
            ) : null}
            <span className={styles.hint}>Arrastra con clic izquierdo para mover</span>
          </div>
          <TransformComponent wrapperClass={styles.transformWrapper} contentClass={styles.transformContent}>
            <div className={styles.diagram}>{children}</div>
          </TransformComponent>
        </div>
      )}
    </TransformWrapper>
  );
}

export default function Mermaid(props) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return undefined;

    document.body.style.overflow = 'hidden';

    function handleEsc(event) {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    }

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  return (
    <>
      <div className={styles.container}>
        <DiagramViewport onRequestFullscreen={() => setIsFullscreen(true)}>
          <MermaidOriginal {...props} />
        </DiagramViewport>
      </div>

      {isFullscreen ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setIsFullscreen(false)}>
          <div className={styles.overlayInner} onClick={(event) => event.stopPropagation()}>
            <button
              className={styles.close}
              type="button"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen">
              Close
            </button>
            <DiagramViewport>
              <MermaidOriginal {...props} />
            </DiagramViewport>
          </div>
        </div>
      ) : null}
    </>
  );
}
