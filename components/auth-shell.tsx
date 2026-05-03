"use client";

import { Card, Typography } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";

const { Text, Title } = Typography;

export function AuthShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link href="/login" className="auth-brand">
          <span className="auth-brand-mark">F</span>
          <span>
            <Text className="auth-brand-kicker">Forge Housing</Text>
            <Title level={5}>Admin</Title>
          </span>
        </Link>

        <div className="auth-panel-copy">
          <Text className="dashboard-kicker">{eyebrow}</Text>
          <Title level={1}>{title}</Title>
        </div>
      </section>

      <section className="auth-form-wrap">
        <Card className="auth-card">{children}</Card>
      </section>
    </main>
  );
}
