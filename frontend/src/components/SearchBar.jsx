import React from 'react';

export default function SearchBar({ query, setQuery, onSearch }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <input
        type="text"
        placeholder="Search emails..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: '8px', width: '300px' }}
      />
      <button onClick={onSearch} style={{ marginLeft: '10px', padding: '8px' }}>
        Search
      </button>
    </div>
  );
}
