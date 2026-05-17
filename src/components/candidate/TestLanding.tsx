'use client';

import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  List,
  ListItem,
  Title,
} from '@patternfly/react-core';
import { type FC, useEffect, useState } from 'react';

import type { TestInfo } from '@/app/test/[token]/page';

type TestLandingProps = {
  test: TestInfo;
  onStart: () => void;
};

const MOBILE_WIDTH_THRESHOLD = 768;

const TestLanding: FC<TestLandingProps> = ({ test, onStart }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_WIDTH_THRESHOLD);
  }, []);

  return (
    <div
      style={{
        maxWidth: '700px',
        margin: '4rem auto',
        padding: '0 1rem',
      }}
    >
      <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
        {test.title}
      </Title>

      {isMobile && (
        <Alert
          variant="warning"
          title="Desktop recommended"
          isInline
          style={{ marginBottom: '1rem' }}
        >
          This test includes coding questions. A desktop browser is
          strongly recommended for the best experience.
        </Alert>
      )}

      <Card>
        <CardTitle>Test Information</CardTitle>
        <CardBody>
          {test.description && (
            <p style={{ marginBottom: '1rem' }}>{test.description}</p>
          )}
          <List>
            <ListItem>
              <strong>Questions:</strong> {test.questions.length}
            </ListItem>
            <ListItem>
              <strong>Time Limit:</strong> {test.timeLimitMinutes} minutes
            </ListItem>
            <ListItem>
              <strong>Navigation:</strong> You can move between questions
              freely
            </ListItem>
            <ListItem>
              <strong>Auto-save:</strong> Your answers are saved
              automatically
            </ListItem>
            <ListItem>
              <strong>Auto-submit:</strong> The test will be submitted
              automatically when time runs out
            </ListItem>
          </List>
        </CardBody>
      </Card>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Button size="lg" onClick={onStart}>
          Start Test
        </Button>
        <p
          style={{
            marginTop: '0.5rem',
            color: 'var(--pf-t--global--color--subtle)',
          }}
        >
          The timer begins when you click Start Test.
        </p>
      </div>
    </div>
  );
};

export default TestLanding;
