"use client";

import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, Space, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth-shell";
import { useAuth } from "@/hooks/useAuth";

const { Text, Title } = Typography;

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: LoginValues) => {
    setLoading(true);
    setError(null);

    const result = await signIn(values);
    setLoading(false);

    if (result.success) {
      router.push("/dashboard");
      return;
    }

    setError(result.message || "Unable to sign in");
  };

  return (
    <AuthShell eyebrow="Admin access" title="Forge Admin">
      <Space direction="vertical" size={6} className="full-width auth-card-head">
        <Text className="dashboard-kicker">Welcome back</Text>
        <Title level={2}>Login</Title>
      </Space>

      {error ? <Text type="danger">{error}</Text> : null}

      <Form layout="vertical" requiredMark={false} onFinish={handleSubmit}>
        <Form.Item
          label="Email address"
          name="email"
          rules={[
            { required: true, message: "Enter your admin email." },
            { type: "email", message: "Enter a valid email address." },
          ]}
        >
          <Input
            size="large"
            prefix={<MailOutlined />}
            placeholder="admin@forgehousing.com"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Enter your password." }]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            placeholder="Enter password"
            autoComplete="current-password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <div className="auth-form-meta">
          <Link href="/forgot-password">Forgot password?</Link>
        </div>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Sign In
        </Button>
      </Form>
    </AuthShell>
  );
}
