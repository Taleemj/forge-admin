"use client";

import {
  ArrowLeftOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Alert, Button, Form, Input, Progress, Space, Typography } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AuthShell } from "@/components/auth-shell";
import { useAuth } from "@/hooks/useAuth";

const { Text, Title } = Typography;

type ResetValues = {
  otp: string;
  password: string;
  confirmPassword: string;
};

function passwordScore(password = "") {
  let score = 0;
  if (password.length >= 8) score += 35;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  return Math.min(score, 100);
}

function ResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const [form] = Form.useForm<ResetValues>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const password = Form.useWatch("password", form);
  const score = passwordScore(password);
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const otp = useMemo(() => searchParams.get("otp") ?? "", [searchParams]);

  const handleSubmit = async (values: ResetValues) => {
    setLoading(true);
    setError(null);

    const result = await resetPassword({
      email,
      otp: values.otp,
      password: values.password,
    });
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      window.setTimeout(() => router.push("/login"), 650);
      return;
    }

    setError(result.message || "Unable to reset password");
  };

  return (
    <AuthShell
      eyebrow="New credential"
      title="Set Password"
    >
      <Link
        href={`/verify-otp${email ? `?email=${encodeURIComponent(email)}&mode=reset` : ""}`}
        className="auth-back-link"
      >
        <ArrowLeftOutlined /> Back to OTP
      </Link>

      <Space direction="vertical" size={6} className="full-width auth-card-head">
        <Text className="dashboard-kicker">Final step</Text>
        <Title level={2}>Reset password</Title>
      </Space>

      {success ? (
        <Alert
          type="success"
          showIcon
          message="Password reset complete"
        />
      ) : null}
      {error ? <Text type="danger">{error}</Text> : null}

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        initialValues={{ otp }}
      >
        <Form.Item
          label="OTP"
          name="otp"
          rules={[
            { required: true, message: "Enter the OTP." },
            { len: 6, message: "OTP must be 6 digits." },
          ]}
        >
          <Input
            size="large"
            prefix={<SafetyCertificateOutlined />}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            className="auth-otp-input"
          />
        </Form.Item>

        <Form.Item
          label="New password"
          name="password"
          rules={[
            { required: true, message: "Enter a new password." },
            { min: 8, message: "Password must be at least 8 characters." },
          ]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            placeholder="Enter new password"
            autoComplete="new-password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <div className="auth-password-meter">
          <Progress percent={score} showInfo={false} size="small" />
        </div>

        <Form.Item
          label="Confirm password"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Confirm your password." },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match."));
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            placeholder="Confirm new password"
            autoComplete="new-password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Reset Password
        </Button>
      </Form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordView />
    </Suspense>
  );
}
