import { useEffect, useRef, useState } from 'react';

export default function SearchPanel({ isOpen, onClose, countryMetrics, onCountrySelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredCountries = countryMetrics.filter((country) =>
    country.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`overlay-panel from-right search-panel${isOpen ? ' open' : ''}`}>
      <div className="overlay-panel-header">
        <h2>Search Realms</h2>
        <button type="button" className="overlay-close-btn" onClick={onClose} aria-label="Close">
          x
        </button>
      </div>

      <div className="overlay-panel-body">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search by realm name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="search-results">
          {filteredCountries.length === 0 && searchQuery && (
            <p className="muted">No realms found matching &apos;{searchQuery}&apos;</p>
          )}

          {filteredCountries.map((country) => (
            <button
              key={country.id}
              type="button"
              className="search-card"
              onClick={() => {
                onCountrySelect(country.continentId, country);
                onClose();
              }}
            >
              <strong>{country.title}</strong>
              <p className="muted">
                {country.questCount} states | Complexity {Math.round(country.complexity)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
