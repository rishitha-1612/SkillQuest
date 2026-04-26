import CountrySkillsPanel from './CountrySkillsPanel';
import StatePathwayPanel from './StatePathwayPanel';

export default function RealmOverviewPanel({
  isOpen,
  onClose,
  country,
  roleDetails,
  statesMeta,
  selectedStateId,
  onStateSelect,
  stateDetails,
}) {
  return (
    <div className={`overlay-panel from-right realm-overview-panel${isOpen ? ' open' : ''}`}>
      <div className="overlay-panel-header">
        <h2>Realm Overview</h2>
        <button type="button" className="overlay-close-btn" onClick={onClose} aria-label="Close">
          x
        </button>
      </div>

      <div className="overlay-panel-body realm-overview-content">
        <CountrySkillsPanel
          country={country}
          roleDetails={roleDetails}
          statesMeta={statesMeta}
          selectedStateId={selectedStateId}
          onStateSelect={onStateSelect}
        />

        <StatePathwayPanel stateDetails={stateDetails} />
      </div>
    </div>
  );
}
