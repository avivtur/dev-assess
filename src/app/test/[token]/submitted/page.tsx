'use client';

import { Title } from '@patternfly/react-core';
import type { FC } from 'react';

const SubmittedPage: FC = () => {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
        Thank You!
      </Title>
      <p>
        Your test has been submitted successfully. The hiring team will
        review your answers and get back to you.
      </p>
    </div>
  );
};

export default SubmittedPage;
