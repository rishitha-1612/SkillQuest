import React from 'react';
import { getRoleWorldProfile } from '../data/worldConfig';

export default function CountrySkillsPanel({ country, roleDetails, statesMeta, onStateSelect, selectedStateId }) {
  if (!country) {
    return (
      <section className="panel-card">
        <h2>Job Kingdom</h2>
        <p className="muted">Pick a realm.</p>
      </section>
    );
  }

  const requirements = roleDetails?.state_requirements || [];
  const profile = getRoleWorldProfile(country.id);

  return (
    <section className="panel-card">
      <div className="panel-kicker">Realm Overview</div>
      <h2>{country.title}</h2>
      <p className="muted">{profile.realm} in {profile.countryName}</p>
      <p className="panel-summary">{roleDetails?.summary}</p>

      <div className="mini-stats">
        <article>
          <span>Skill Provinces</span>
          <strong>{requirements.length}</strong>
        </article>
        <article>
          <span>Core Tools</span>
          <strong>{roleDetails?.core_tools?.length || 0}</strong>
        </article>
      </div>

      <div className="tool-ribbon">
        {(roleDetails?.core_tools || []).map((tool) => (
          <span key={tool} className="tool-chip">{tool}</span>
        ))}
      </div>

      <p className="muted">Choose a province.</p>
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
