'use client';

import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  TextInput,
  Title,
} from '@patternfly/react-core';
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { type FC, useCallback, useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

const UsersPage: FC = () => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'recruiter',
  });

  const loadUsers = useCallback((): void => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsersList(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async (): Promise<void> => {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setIsModalOpen(false);
    setForm({ email: '', name: '', password: '', role: 'recruiter' });
    loadUsers();
  };

  return (
    <PageSection>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <Title headingLevel="h1">User Management</Title>
        <Button onClick={() => setIsModalOpen(true)}>Create User</Button>
      </div>

      <Table aria-label="Users table">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Created</Th>
          </Tr>
        </Thead>
        <Tbody>
          {usersList.map((u) => (
            <Tr key={u.id}>
              <Td>{u.name}</Td>
              <Td>{u.email}</Td>
              <Td>{u.role}</Td>
              <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-label="Create user"
        variant="small"
      >
        <ModalHeader title="Create User" />
        <ModalBody>
          <Form>
            <FormGroup label="Name" isRequired fieldId="user-name">
              <TextInput
                id="user-name"
                value={form.name}
                onChange={(_e, val) =>
                  setForm((f) => ({ ...f, name: val }))
                }
                isRequired
              />
            </FormGroup>
            <FormGroup label="Email" isRequired fieldId="user-email">
              <TextInput
                id="user-email"
                type="email"
                value={form.email}
                onChange={(_e, val) =>
                  setForm((f) => ({ ...f, email: val }))
                }
                isRequired
              />
            </FormGroup>
            <FormGroup label="Password" isRequired fieldId="user-password">
              <TextInput
                id="user-password"
                type="password"
                value={form.password}
                onChange={(_e, val) =>
                  setForm((f) => ({ ...f, password: val }))
                }
                isRequired
              />
            </FormGroup>
            <FormGroup label="Role" isRequired fieldId="user-role">
              <FormSelect
                id="user-role"
                value={form.role}
                onChange={(_e, val) =>
                  setForm((f) => ({ ...f, role: val }))
                }
              >
                <FormSelectOption value="manager" label="Manager" />
                <FormSelectOption value="recruiter" label="Recruiter" />
              </FormSelect>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <ActionGroup>
            <Button onClick={handleCreate}>Create</Button>
            <Button
              variant="link"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </ActionGroup>
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default UsersPage;
