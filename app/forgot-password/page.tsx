"use client";

import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Form, Input, Space, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth-shell";

const { Text, Title } = Typography;

type ForgotValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (values: ForgotValues) => {
    setLoading(true);

    window.setTimeout(() => {
      setLoading(false);
      router.push(`/verify-otp?email=${encodeURIComponent(values.email)}&mode=reset`);
    }, 500);
  };

  return (
    <AuthShell eyebrow="Password recovery" title="Recover Access">
      <Link href="/login" className="auth-back-link">
        <ArrowLeftOutlined /> Back to login
      </Link>

      <Space direction="vertical" size={6} className="full-width auth-card-head">
        <Text className="dashboard-kicker">Reset request</Text>
        <Title level={2}>Forgot password</Title>
      </Space>

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

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Send Reset Code
        </Button>
      </Form>
    </AuthShell>
  );
}
