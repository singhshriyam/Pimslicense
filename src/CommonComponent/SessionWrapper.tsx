"use client";

import React from 'react';

interface SessionWrapperProps {
  children: React.ReactNode;
  session?: any; // Optional for compatibility
}

const SessionWrapper: React.FC<SessionWrapperProps> = ({ children }) => {
  return <>{children}</>;
}

export default SessionWrapper;
