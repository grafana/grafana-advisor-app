import React from 'react';

// Mock implementation of react-markdown for testing
// This avoids ES module import issues in Jest
export default function MockMarkdown({ children }: { children: string }) {
  return <div data-testid="markdown-content">{children}</div>;
}
