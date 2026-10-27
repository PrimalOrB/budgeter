import React from 'react';
import './SpinLoader.css';

const SpinLoader = () => (
    <div className="loader" role="status" aria-label="Loading">
        <span className="spinner" />
    </div>
);

export default SpinLoader;
