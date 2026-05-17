'use client';

import {
  ActionGroup,
  Button,
  Card,
  CardBody,
  CardTitle,
  Form,
  FormGroup,
  HelperText,
  HelperTextItem,
  LoginPage,
  TextInput,
} from '@patternfly/react-core';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { type FC, useState } from 'react';

const LoginPageView: FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <LoginPage
      brandImgSrc=""
      loginTitle="DevAssess"
      loginSubtitle="Sign in to manage your interview assessments"
    >
      <Card>
        <CardTitle>Sign In</CardTitle>
        <CardBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup label="Email" isRequired fieldId="email">
              <TextInput
                id="email"
                type="email"
                value={email}
                onChange={(_e, val) => setEmail(val)}
                isRequired
              />
            </FormGroup>
            <FormGroup label="Password" isRequired fieldId="password">
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(_e, val) => setPassword(val)}
                isRequired
              />
            </FormGroup>
            {error && (
              <HelperText>
                <HelperTextItem variant="error">{error}</HelperTextItem>
              </HelperText>
            )}
            <ActionGroup>
              <Button
                type="submit"
                isLoading={loading}
                isDisabled={loading}
              >
                Sign In
              </Button>
            </ActionGroup>
          </Form>
        </CardBody>
      </Card>
    </LoginPage>
  );
};

export default LoginPageView;
