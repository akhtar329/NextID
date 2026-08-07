"use client";

import styles from "./Loader.module.css";

export default function Loader() {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>

        <h1 className={styles.logo}>
          <span className={styles.next}>NEXT</span>
          <span className={styles.id}>ID</span>
        </h1>

        <div className={styles.line}>
          <span />
        </div>

        <p className={styles.text}>
          Loading Experience
        </p>

      </div>
    </div>
  );
}