"use client";

import {
  BoldOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Input, Select, Tabs, Typography } from "antd";
import type { ReactNode } from "react";

const { TextArea } = Input;
const { Paragraph, Title } = Typography;

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    const strong = part.match(/^\*\*([^*]+)\*\*$/);
    if (strong) {
      return <strong key={`${part}-${index}`}>{strong[1]}</strong>;
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={`${part}-${index}`} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderMarkdown(markdown: string): ReactNode {
  const lines = markdown.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let orderedItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;

    nodes.push(
      <ul key={`list-${nodes.length}`}>
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const flushOrderedList = () => {
    if (!orderedItems.length) return;

    nodes.push(
      <ol key={`ordered-list-${nodes.length}`}>
        {orderedItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ol>,
    );
    orderedItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      flushOrderedList();
      return;
    }

    if (trimmed.startsWith("- ")) {
      flushOrderedList();
      listItems.push(trimmed.slice(2));
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      flushList();
      orderedItems.push(trimmed.replace(/^\d+\.\s/, ""));
      return;
    }

    flushList();
    flushOrderedList();

    if (trimmed.startsWith("### ")) {
      nodes.push(
        <Title level={5} key={index}>
          {renderInline(trimmed.slice(4))}
        </Title>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      nodes.push(
        <Title level={4} key={index}>
          {renderInline(trimmed.slice(3))}
        </Title>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      nodes.push(
        <Title level={3} key={index}>
          {renderInline(trimmed.slice(2))}
        </Title>,
      );
      return;
    }

    nodes.push(<Paragraph key={index}>{renderInline(trimmed)}</Paragraph>);
  });

  flushList();
  flushOrderedList();

  return nodes.length ? nodes : <Paragraph type="secondary">Preview appears here.</Paragraph>;
}

export function MarkdownPreview({ value }: { value?: string }) {
  return <div className="markdown-preview">{renderMarkdown(value ?? "")}</div>;
}

export function MarkdownEditor({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const markdown = value ?? "";
  const setMarkdown = (nextValue: string) => onChange?.(nextValue);

  const applyHeading = (level: string) => {
    const lines = markdown.split("\n");
    const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);
    const index = firstContentIndex >= 0 ? firstContentIndex : 0;
    const currentLine = lines[index] ?? "";
    const cleanLine = currentLine.replace(/^#{1,3}\s/, "").replace(/^[-*]\s/, "");

    if (level === "paragraph") {
      lines[index] = cleanLine;
    } else {
      lines[index] = `${level} ${cleanLine || "Heading"}`;
    }

    setMarkdown(lines.join("\n"));
  };

  const toggleBold = () => {
    setMarkdown(markdown ? `${markdown}\n\n**Bold text**` : "**Bold text**");
  };

  const addList = (ordered = false) => {
    const starter = ordered ? "1. First item\n2. Second item" : "- First item\n- Second item";
    setMarkdown(markdown ? `${markdown}\n\n${starter}` : starter);
  };

  return (
    <Card className="markdown-editor" size="small">
      <Tabs
        items={[
          {
            key: "write",
            label: "Write",
            children: (
              <>
                <Flex align="center" gap={8} wrap="wrap" className="markdown-toolbar">
                  <Select
                    value="paragraph"
                    onChange={applyHeading}
                    className="markdown-block-select"
                    options={[
                      { value: "paragraph", label: "Paragraph" },
                      { value: "#", label: "Heading 1" },
                      { value: "##", label: "Heading 2" },
                      { value: "###", label: "Heading 3" },
                    ]}
                  />
                  <Button icon={<BoldOutlined />} onClick={toggleBold}>
                    Bold
                  </Button>
                  <Button icon={<UnorderedListOutlined />} onClick={() => addList()}>
                    Bullets
                  </Button>
                  <Button icon={<OrderedListOutlined />} onClick={() => addList(true)}>
                    Numbered
                  </Button>
                </Flex>
                <TextArea
                  value={markdown}
                  onChange={(event) => onChange?.(event.target.value)}
                  rows={11}
                  placeholder={
                    "# Overview\nAdd formatted listing copy, highlights, links, and buyer notes."
                  }
                />
              </>
            ),
          },
          {
            key: "preview",
            label: "Preview",
            children: <MarkdownPreview value={markdown} />,
          },
        ]}
      />
    </Card>
  );
}
