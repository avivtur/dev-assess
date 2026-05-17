'use client';

import { Checkbox, Radio, TextArea } from '@patternfly/react-core';
import { type FC } from 'react';

import MarkdownRenderer from '@/components/common/MarkdownRenderer';

import type { McOption } from '@/db/schema';

type TheoryQuestionProps = {
  type: 'multiple_choice' | 'free_text';
  content: string;
  options: McOption[] | null;
  allowMultiple: boolean;
  answerContent: string;
  selectedOptions: number[];
  onAnswerChange: (content: string) => void;
  onOptionsChange: (selected: number[]) => void;
};

const TheoryQuestion: FC<TheoryQuestionProps> = ({
  type,
  content,
  options,
  allowMultiple,
  answerContent,
  selectedOptions,
  onAnswerChange,
  onOptionsChange,
}) => {
  const handleOptionToggle = (idx: number): void => {
    if (allowMultiple) {
      const next = selectedOptions.includes(idx)
        ? selectedOptions.filter((i) => i !== idx)
        : [...selectedOptions, idx];
      onOptionsChange(next);
    } else {
      onOptionsChange([idx]);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <MarkdownRenderer content={content} />
      </div>

      {type === 'multiple_choice' && options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {options.map((opt, idx) =>
            allowMultiple ? (
              <Checkbox
                key={idx}
                id={`option-${idx}`}
                label={opt.text}
                isChecked={selectedOptions.includes(idx)}
                onChange={() => handleOptionToggle(idx)}
              />
            ) : (
              <Radio
                key={idx}
                id={`option-${idx}`}
                name="mc-option"
                label={opt.text}
                isChecked={selectedOptions.includes(idx)}
                onChange={() => handleOptionToggle(idx)}
              />
            ),
          )}
        </div>
      )}

      {type === 'free_text' && (
        <TextArea
          value={answerContent}
          onChange={(_e, val) => onAnswerChange(val)}
          rows={8}
          placeholder="Type your answer here..."
          style={{ width: '100%' }}
        />
      )}
    </div>
  );
};

export default TheoryQuestion;
