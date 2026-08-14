import type { Meta, StoryObj } from "@storybook/react";
import type { ApiStory } from "@yenihaber/shared";
import { StoriesStrip } from "./stories-strip";

const sample: ApiStory[] = [
  {
    id: "1",
    title: "Gündem",
    kind: "durum",
    mediaUrl: "https://picsum.photos/seed/yh1/800/1200",
    posterUrl: "https://picsum.photos/seed/yh1/200/200",
    linkUrl: null,
    videoProvider: null,
    videoId: null,
    status: "active",
    sortOrder: 1,
    expiresAt: null,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Short",
    kind: "short",
    mediaUrl: "https://picsum.photos/seed/yh2/800/1200",
    posterUrl: "https://picsum.photos/seed/yh2/200/200",
    linkUrl: null,
    videoProvider: null,
    videoId: null,
    status: "active",
    sortOrder: 2,
    expiresAt: null,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const meta: Meta<typeof StoriesStrip> = {
  title: "Site/StoriesStrip",
  component: StoriesStrip,
  args: { items: sample },
};

export default meta;
type Story = StoryObj<typeof StoriesStrip>;

export const Default: Story = {};
