"use client";

import { ArrowLeftOutlined, MailOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Space, Typography } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AuthShell } from "@/components/auth-shell";
import { useAuth } from "@/hooks/useAuth";

const { Text, Title } = Typography;

type OtpValues = {
  emailDisplay?: string;
  otp: string;
};

function VerifyOtpView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { forgotPassword, verifyResetOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

  const handleSubmit = async (values: OtpValues) => {
    setLoading(true);
    setError(null);
    const resetEmail = email || values.emailDisplay || "";

    const result = await verifyResetOtp({ email: resetEmail, otp: values.otp });
    setLoading(false);

    if (result.success) {
      router.push(
        `/reset-password?email=${encodeURIComponent(resetEmail)}&otp=${encodeURIComponent(
          values.otp,
        )}`,
      );
      return;
    }

    setError(result.message || "Invalid reset code");
  };

  const handleResend = async () => {
    const resetEmail = email;
    if (!resetEmail) return;

    setResending(true);
    setError(null);
    const result = await forgotPassword({ email: resetEmail });
    setResending(false);

    if (result.success) {
      setResent(true);
      return;
    }

    setError(result.message || "Unable to resend code");
  };

  return (
    <AuthShell
      eyebrow="OTP verification"
      title="Verify Code"
    >
      <Link href="/forgot-password" className="auth-back-link">
        <ArrowLeftOutlined /> Change email
      </Link>

      <Space direction="vertical" size={6} className="full-width auth-card-head">
        <Text className="dashboard-kicker">Verification</Text>
        <Title level={2}>Enter OTP</Title>
      </Space>

      {resent ? (
        <Alert type="success" showIcon message="A new code has been queued for this email." />
      ) : null}
      {error ? <Text type="danger">{error}</Text> : null}

      <Form layout="vertical" requiredMark={false} onFinish={handleSubmit}>
        {!email ? (
          <Form.Item
            label="Email address"
            name="emailDisplay"
            rules={[{ required: true }]}
            initialValue=""
          >
            <Input size="large" prefix={<MailOutlined />} placeholder="admin@forgehousing.com" />
          </Form.Item>
        ) : null}

        <Form.Item
          label="6-digit OTP"
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
            inputMode="numeric"
            maxLength={6}
            className="auth-otp-input"
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Verify Code
        </Button>

        {email ? (
          <Button type="link" block loading={resending} onClick={handleResend}>
            Resend Code
          </Button>
        ) : null}
      </Form>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpView />
    </Suspense>
  );
}
