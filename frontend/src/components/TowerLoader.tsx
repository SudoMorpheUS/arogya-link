import type { CSSProperties } from "react";
import styles from "./TowerLoader.module.css";

const BOXES = [styles.box1, styles.box2, styles.box3, styles.box4];

/** The 3D tower loader. `scale` is the original design's scale (3 = full size). */
export function TowerLoader({ scale = 3, label = "Loading" }: { scale?: number; label?: string }) {
  return (
    <div
      className={styles.frame}
      style={{ "--s": scale } as CSSProperties}
      role="status"
      aria-label={label}
    >
      <div className={styles.loader} aria-hidden="true">
        {BOXES.map((box, i) => (
          <div key={i} className={`${styles.box} ${box}`}>
            <div className={styles.sideLeft} />
            <div className={styles.sideRight} />
            <div className={styles.sideTop} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Centered loader with a caption, used by loading.tsx files and the splash screen. */
export function LoaderScreen({ caption = "Loading" }: { caption?: string }) {
  return (
    <div className="loader-screen">
      <TowerLoader label={caption} />
      <p className="loader-caption">{caption}…</p>
    </div>
  );
}

/** Static three-face cube in the loader's palette; used as the brand mark. */
export function CubeMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        flexShrink: 0,
        filter: "drop-shadow(0 2px 6px rgba(59, 130, 246, 0.35))",
        verticalAlign: "middle",
      }}
    >
      <polygon points="12,1.5 22,7 12,12.5 2,7" fill="var(--loader-top)" />
      <polygon points="2,7 12,12.5 12,23.5 2,18" fill="var(--loader-left)" />
      <polygon points="22,7 12,12.5 12,23.5 22,18" fill="var(--loader-right)" />
    </svg>
  );
}
