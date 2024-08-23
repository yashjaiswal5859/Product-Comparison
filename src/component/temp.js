import React, { useState } from 'react';
import './temp.css';

const SplitScreenComponent = () => {
  return (
    <div className="split-screen">
      <iframe src="https://www.amazon.in/&output=embed" title="https://www.amazon.in/" className="iframe" />
      <iframe src="https://www.amazon.in/&output=embed" title="https://www.amazon.in/" className="iframe" />
    </div>
  );
};

export default SplitScreenComponent;
