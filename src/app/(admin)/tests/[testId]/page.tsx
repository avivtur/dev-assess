'use client';

import {
  ActionGroup,
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  NumberInput,
  PageSection,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';
import { PencilAltIcon, TrashIcon } from '@patternfly/react-icons';
import { useParams, useRouter } from 'next/navigation';
import { type FC, useCallback, useEffect, useState } from 'react';

import MarkdownRenderer from '@/components/common/MarkdownRenderer';

import type { McOption } from '@/db/schema';

type Question = {
  id: string;
  type: 'multiple_choice' | 'free_text' | 'coding';
  content: string;
  options: McOption[] | null;
  allowMultiple: boolean;
  points: number;
  starterCode: string | null;
  allowedLanguages: string[] | null;
  orderIndex: number;
};

type TestDetail = {
  id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  isActive: boolean;
  questions: Question[];
};

const AVAILABLE_LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'ruby',
  'rust',
  'php',
  'swift',
  'kotlin',
];

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'free_text', label: 'Free Text' },
  { value: 'coding', label: 'Coding' },
];

const TestDetailPage: FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    timeLimitMinutes: 60,
  });
  const [saving, setSaving] = useState(false);

  type QuestionForm = {
    type: 'multiple_choice' | 'free_text' | 'coding';
    content: string;
    options: { text: string; isCorrect: boolean }[];
    allowMultiple: boolean;
    points: number;
    starterCode: string;
    allowedLanguages: string[];
  };

  const emptyQuestion: QuestionForm = {
    type: 'multiple_choice',
    content: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    allowMultiple: false,
    points: 1,
    starterCode: '',
    allowedLanguages: ['python', 'javascript'],
  };

  const [qForm, setQForm] = useState<QuestionForm>(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );

  const loadTest = useCallback((): void => {
    fetch(`/api/tests/${testId}`)
      .then((r) => r.json())
      .then(setTest)
      .catch(() => {});
  }, [testId]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  const openEditModal = (): void => {
    if (!test) return;
    setEditForm({
      title: test.title,
      description: test.description,
      timeLimitMinutes: test.timeLimitMinutes,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveTest = async (): Promise<void> => {
    setSaving(true);
    await fetch(`/api/tests/${testId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    setIsEditModalOpen(false);
    loadTest();
  };

  const handleDeleteTest = async (): Promise<void> => {
    await fetch(`/api/tests/${testId}`, { method: 'DELETE' });
    router.push('/tests');
  };

  const openAddQuestionModal = (): void => {
    setEditingQuestionId(null);
    setQForm(emptyQuestion);
    setIsModalOpen(true);
  };

  const openEditQuestionModal = (q: Question): void => {
    setEditingQuestionId(q.id);
    setQForm({
      type: q.type,
      content: q.content,
      options: q.options ?? [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      allowMultiple: q.allowMultiple,
      points: q.points,
      starterCode: q.starterCode ?? '',
      allowedLanguages: q.allowedLanguages ?? ['python', 'javascript'],
    });
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (): Promise<void> => {
    const payload = {
      type: qForm.type,
      content: qForm.content,
      options: qForm.type === 'multiple_choice' ? qForm.options : null,
      allowMultiple: qForm.allowMultiple,
      points: qForm.points,
      starterCode: qForm.type === 'coding' ? qForm.starterCode : null,
      allowedLanguages:
        qForm.type === 'coding' ? qForm.allowedLanguages : null,
    };

    if (editingQuestionId) {
      await fetch(`/api/questions/${editingQuestionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          testId,
          orderIndex: test?.questions.length ?? 0,
        }),
      });
    }

    setIsModalOpen(false);
    setEditingQuestionId(null);
    setQForm(emptyQuestion);
    loadTest();
  };

  const handleDeleteQuestion = async (qId: string): Promise<void> => {
    await fetch(`/api/questions/${qId}`, { method: 'DELETE' });
    loadTest();
  };

  const addOption = (): void => {
    setQForm((f) => ({
      ...f,
      options: [...(f.options ?? []), { text: '', isCorrect: false }],
    }));
  };

  const updateOption = (
    idx: number,
    field: 'text' | 'isCorrect',
    value: string | boolean,
  ): void => {
    setQForm((f) => ({
      ...f,
      options: f.options.map((o, i) =>
        i === idx ? { ...o, [field]: value } : o,
      ),
    }));
  };

  const removeOption = (idx: number): void => {
    setQForm((f) => ({
      ...f,
      options: f.options.filter((_, i) => i !== idx),
    }));
  };

  const toggleLanguage = (lang: string): void => {
    setQForm((f) => {
      const current = f.allowedLanguages ?? [];
      const next = current.includes(lang)
        ? current.filter((l) => l !== lang)
        : [...current, lang];
      return { ...f, allowedLanguages: next };
    });
  };

  if (!test) return <PageSection>Loading...</PageSection>;

  return (
    <PageSection>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ flex: '1 1 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Title headingLevel="h1">{test.title}</Title>
            <Button
              variant="plain"
              aria-label="Edit test"
              onClick={openEditModal}
            >
              <PencilAltIcon />
            </Button>
          </div>
          <p style={{ color: 'var(--pf-t--global--color--subtle)' }}>
            {test.description} &middot; {test.timeLimitMinutes} min &middot;{' '}
            {test.questions.length} questions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <Button
            variant="secondary"
            onClick={() => router.push(`/tests/${testId}/invite`)}
          >
            Invite Candidates
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/tests/${testId}/results`)}
          >
            View Results
          </Button>
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Test
          </Button>
        </div>
      </div>

      {test.questions.map((q, idx) => (
        <Card key={q.id} style={{ marginBottom: '1rem' }}>
          <CardTitle>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                Q{idx + 1}: {q.type.replace('_', ' ')} ({q.points} pts)
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <Button
                  variant="plain"
                  aria-label="Edit question"
                  onClick={() => openEditQuestionModal(q)}
                >
                  <PencilAltIcon />
                </Button>
                <Button
                  variant="plain"
                  aria-label="Delete question"
                  onClick={() => handleDeleteQuestion(q.id)}
                >
                  <TrashIcon />
                </Button>
              </div>
            </div>
          </CardTitle>
          <CardBody>
            <MarkdownRenderer content={q.content} />
            {q.type === 'multiple_choice' && q.options && (
              <ul style={{ marginTop: '0.5rem' }}>
                {q.options.map((opt, oi) => (
                  <li
                    key={oi}
                    style={{
                      fontWeight: opt.isCorrect ? 'bold' : 'normal',
                      color: opt.isCorrect ? 'green' : undefined,
                    }}
                  >
                    {opt.text} {opt.isCorrect && '(correct)'}
                  </li>
                ))}
              </ul>
            )}
            {q.type === 'coding' && (
              <p>
                Languages: {q.allowedLanguages?.join(', ') ?? 'any'}
              </p>
            )}
          </CardBody>
        </Card>
      ))}

      <Button onClick={openAddQuestionModal}>Add Question</Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuestionId(null);
          setQForm(emptyQuestion);
        }}
        aria-label={editingQuestionId ? 'Edit question' : 'Add question'}
        variant="large"
      >
        <ModalHeader
          title={editingQuestionId ? 'Edit Question' : 'Add Question'}
        />
        <ModalBody style={{ paddingBottom: '1.5rem' }}>
          <Form>
            <FormGroup label="Type" isRequired fieldId="q-type">
              <FormSelect
                id="q-type"
                value={qForm.type}
                onChange={(_e, val) =>
                  setQForm((f) => ({
                    ...f,
                    type: val as Question['type'],
                  }))
                }
              >
                {QUESTION_TYPES.map((qt) => (
                  <FormSelectOption
                    key={qt.value}
                    value={qt.value}
                    label={qt.label}
                  />
                ))}
              </FormSelect>
            </FormGroup>

            <FormGroup
              label="Content (Markdown)"
              isRequired
              fieldId="q-content"
            >
              <TextArea
                id="q-content"
                value={qForm.content}
                onChange={(_e, val) =>
                  setQForm((f) => ({ ...f, content: val }))
                }
                rows={6}
              />
              <Button
                variant="link"
                isInline
                onClick={() => setShowPreview((s) => !s)}
                style={{ marginTop: '0.25rem' }}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              {showPreview && (
                <Card isPlain style={{ marginTop: '0.5rem' }}>
                  <CardBody>
                    <MarkdownRenderer content={qForm.content} />
                  </CardBody>
                </Card>
              )}
            </FormGroup>

            <FormGroup label="Points" isRequired fieldId="q-points">
              <NumberInput
                id="q-points"
                value={qForm.points}
                min={1}
                max={100}
                onMinus={() =>
                  setQForm((f) => ({
                    ...f,
                    points: Math.max(1, f.points - 1),
                  }))
                }
                onPlus={() =>
                  setQForm((f) => ({
                    ...f,
                    points: Math.min(100, f.points + 1),
                  }))
                }
                onChange={(e) =>
                  setQForm((f) => ({
                    ...f,
                    points: Number((e.target as HTMLInputElement).value),
                  }))
                }
              />
            </FormGroup>

            {qForm.type === 'multiple_choice' && (
              <>
                <FormGroup fieldId="q-allow-multi">
                  <Checkbox
                    id="q-allow-multi"
                    label="Allow multiple selections"
                    isChecked={qForm.allowMultiple}
                    onChange={(_e, checked) =>
                      setQForm((f) => ({ ...f, allowMultiple: checked }))
                    }
                  />
                </FormGroup>
                <FormGroup label="Options" fieldId="q-options">
                  {qForm.options.map((opt, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        alignItems: 'center',
                        flexWrap: 'nowrap',
                      }}
                    >
                      <TextInput
                        value={opt.text}
                        onChange={(_e, val) =>
                          updateOption(idx, 'text', val)
                        }
                        placeholder={`Option ${idx + 1}`}
                        style={{ flex: 1, minWidth: 0 }}
                      />
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <Checkbox
                          id={`opt-correct-${idx}`}
                          label="Correct"
                          isChecked={opt.isCorrect}
                          onChange={(_e, checked) =>
                            updateOption(idx, 'isCorrect', checked)
                          }
                        />
                      </span>
                      <Button
                        variant="plain"
                        onClick={() => removeOption(idx)}
                        aria-label="Remove option"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  ))}
                  <Button variant="link" onClick={addOption}>
                    Add Option
                  </Button>
                </FormGroup>
              </>
            )}

            {qForm.type === 'coding' && (
              <>
                <FormGroup
                  label="Starter Code"
                  fieldId="q-starter-code"
                >
                  <TextArea
                    id="q-starter-code"
                    value={qForm.starterCode}
                    onChange={(_e, val) =>
                      setQForm((f) => ({ ...f, starterCode: val }))
                    }
                    rows={6}
                    style={{ fontFamily: 'monospace' }}
                  />
                </FormGroup>
                <FormGroup
                  label="Allowed Languages"
                  fieldId="q-languages"
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <Checkbox
                        key={lang}
                        id={`lang-${lang}`}
                        label={lang}
                        isChecked={
                          qForm.allowedLanguages?.includes(lang) ?? false
                        }
                        onChange={() => toggleLanguage(lang)}
                      />
                    ))}
                  </div>
                </FormGroup>
              </>
            )}
          </Form>
        </ModalBody>
        <ModalFooter>
          <ActionGroup>
            <Button onClick={handleSaveQuestion}>
              {editingQuestionId ? 'Save Changes' : 'Add Question'}
            </Button>
            <Button
              variant="link"
              onClick={() => {
                setIsModalOpen(false);
                setEditingQuestionId(null);
                setQForm(emptyQuestion);
              }}
            >
              Cancel
            </Button>
          </ActionGroup>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        aria-label="Edit test"
        variant="small"
      >
        <ModalHeader title="Edit Test" />
        <ModalBody>
          <Form>
            <FormGroup label="Title" isRequired fieldId="edit-title">
              <TextInput
                id="edit-title"
                value={editForm.title}
                onChange={(_e, val) =>
                  setEditForm((f) => ({ ...f, title: val }))
                }
                isRequired
              />
            </FormGroup>
            <FormGroup label="Description" fieldId="edit-description">
              <TextArea
                id="edit-description"
                value={editForm.description}
                onChange={(_e, val) =>
                  setEditForm((f) => ({ ...f, description: val }))
                }
                rows={4}
              />
            </FormGroup>
            <FormGroup
              label="Time Limit (minutes)"
              isRequired
              fieldId="edit-time-limit"
            >
              <NumberInput
                id="edit-time-limit"
                value={editForm.timeLimitMinutes}
                min={5}
                max={480}
                onMinus={() =>
                  setEditForm((f) => ({
                    ...f,
                    timeLimitMinutes: Math.max(5, f.timeLimitMinutes - 5),
                  }))
                }
                onPlus={() =>
                  setEditForm((f) => ({
                    ...f,
                    timeLimitMinutes: Math.min(480, f.timeLimitMinutes + 5),
                  }))
                }
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    timeLimitMinutes: Number(
                      (e.target as HTMLInputElement).value,
                    ),
                  }))
                }
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <ActionGroup>
            <Button
              onClick={handleSaveTest}
              isLoading={saving}
              isDisabled={saving}
            >
              Save
            </Button>
            <Button
              variant="link"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
          </ActionGroup>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        aria-label="Delete test"
        variant="small"
      >
        <ModalHeader title="Delete Test?" />
        <ModalBody>
          This will permanently delete &quot;{test.title}&quot; and all its
          questions, invitations, and submissions. This action cannot be
          undone.
        </ModalBody>
        <ModalFooter>
          <ActionGroup>
            <Button variant="danger" onClick={handleDeleteTest}>
              Delete
            </Button>
            <Button
              variant="link"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
          </ActionGroup>
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default TestDetailPage;
