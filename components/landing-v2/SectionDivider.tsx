import styles from './SectionDivider.module.css';

export function SectionDivider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <span className={styles.line} />
      <span className={styles.diamond} />
      <span className={styles.line} />
    </div>
  );
}
