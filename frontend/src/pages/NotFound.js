import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container">
      <div className="not-found-page text-center">
        <h1 className="mb-3">404 - Page Not Found</h1>
        <p className="mb-4">The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/" className="button">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;