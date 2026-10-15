import { NavLink } from 'react-router-dom';

/**
 * Two or three views of one tab side by side (Lernpfad | Zeichen,
 * Üben | Tempo), as a segmented control at the top of the page.
 */
export function SubNav({ label, items }: { label: string; items: { to: string; label: string }[] }) {
  return (
    <nav className="sub-nav" aria-label={label}>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end className={({ isActive }) => `sub-nav-item${isActive ? ' is-active' : ''}`}>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
