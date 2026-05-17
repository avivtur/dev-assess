'use client';

import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  NumberInput,
  PageSection,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';
import { useRouter } from 'next/navigation';
import { type FC, useState } from 'react';

const DEFAULT_TIME_LIMIT = 60;
const MIN_TIME_LIMIT = 5;
const MAX_TIME_LIMIT = 480;

const CreateTestPage: FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(DEFAULT_TIME_LIMIT);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, timeLimitMinutes }),
    });

    if (res.ok) {
      const test = await res.json();
      router.push(`/tests/${test.id}`);
    }

    setSaving(false);
  };

  return (
    <PageSection>
      <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
        Create Test
      </Title>
      <Form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <FormGroup label="Title" isRequired fieldId="test-title">
          <TextInput
            id="test-title"
            value={title}
            onChange={(_e, val) => setTitle(val)}
            isRequired
          />
        </FormGroup>
        <FormGroup label="Description" fieldId="test-description">
          <TextArea
            id="test-description"
            value={description}
            onChange={(_e, val) => setDescription(val)}
            rows={4}
          />
        </FormGroup>
        <FormGroup
          label="Time Limit (minutes)"
          isRequired
          fieldId="test-time-limit"
        >
          <NumberInput
            id="test-time-limit"
            value={timeLimitMinutes}
            min={MIN_TIME_LIMIT}
            max={MAX_TIME_LIMIT}
            onMinus={() =>
              setTimeLimitMinutes((v) => Math.max(MIN_TIME_LIMIT, v - 5))
            }
            onPlus={() =>
              setTimeLimitMinutes((v) => Math.min(MAX_TIME_LIMIT, v + 5))
            }
            onChange={(e) =>
              setTimeLimitMinutes(
                Number((e.target as HTMLInputElement).value),
              )
            }
          />
        </FormGroup>
        <ActionGroup>
          <Button type="submit" isLoading={saving} isDisabled={saving}>
            Create Test
          </Button>
          <Button variant="link" onClick={() => router.push('/tests')}>
            Cancel
          </Button>
        </ActionGroup>
      </Form>
    </PageSection>
  );
};

export default CreateTestPage;
