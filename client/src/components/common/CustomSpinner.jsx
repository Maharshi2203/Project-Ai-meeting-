import React from 'react';

/**
 * Custom Spinner component from Uiverse.io by PriyanshuGupta28
 */
const CustomSpinner = ({ scale = 1.2, color }) => {
  return (
    <div className="uiverse-spinner-wrapper" style={{ transform: `scale(${scale})` }}>
      <div className="spinner">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            style={color ? { background: color } : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomSpinner;
