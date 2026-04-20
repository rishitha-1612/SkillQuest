import React from 'react';

export default function CountrySkillsPanel({ country, roleDetails, statesMeta, onStateSelect, selectedStateId }) {
  if (!country) {
    return (
      <section className="panel-card">
        <h2>Country / Job</h2>
        <p className="muted">Click a country marker on the map to open the job profile.</p>
      </section>
    );
  }

  const requirements = roleDetails?.state_requirements || [];

  return (
    <section className="panel-card">
      <h2>{country.title}</h2>
      <p className="muted">Major skills required for this job role.</p>
      <div className="skills-list">
        {requirements.map((req) => {
          const state = statesMeta.get(req.state_id);
          const active = selectedStateId === req.state_id;
          return (
            <button
              key={req.state_id}
              className={active ? 'skill-pill active' : 'skill-pill'}
              onClick={() => onStateSelect(req.state_id)}
            >
              <span>{state?.title || req.state_id}</span>
              <small>{req.expected_level}</small>
            </button>
          );
        })}
      </div>
      <ul className="reason-list">
        {requirements.map((req) => (
          <li key={`${req.state_id}-why`}>
            <strong>{statesMeta.get(req.state_id)?.title || req.state_id}:</strong> {req.why_it_matters}
          </li>
        ))}
      </ul>
    </section>
  );
}