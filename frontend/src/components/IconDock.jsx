export default function IconDock({ activeOverlay, onIconClick }) {
  const icons = [
    { id: 'search', label: 'Search', icon: 'S', ariaLabel: 'Search realms' },
    { id: 'help', label: 'Help', icon: '?', ariaLabel: 'View help' },
    { id: 'leaderboard', label: 'Stats', icon: 'T', ariaLabel: 'View leaderboard' },
    { id: 'realm-overview', label: 'Realm', icon: 'R', ariaLabel: 'View realm overview' },
  ];

  return (
    <div className="icon-dock">
      {icons.map((iconConfig) => (
        <button
          key={iconConfig.id}
          type="button"
          className={`icon-dock-button${activeOverlay === iconConfig.id ? ' active' : ''}`}
          aria-label={iconConfig.ariaLabel}
          aria-pressed={activeOverlay === iconConfig.id}
          title={iconConfig.label}
          onClick={(event) => onIconClick(iconConfig.id, event.currentTarget)}
        >
          {iconConfig.icon}
        </button>
      ))}
    </div>
  );
}
