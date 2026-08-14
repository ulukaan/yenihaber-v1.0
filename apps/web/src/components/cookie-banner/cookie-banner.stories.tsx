import type { Meta, StoryObj } from "@storybook/react";
import { CookieBanner } from "./cookie-banner";

const meta: Meta<typeof CookieBanner> = {
  title: "Site/CookieBanner",
  component: CookieBanner,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CookieBanner>;

export const Default: Story = {
  render: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("yh-cookie-consent-v1");
    }
    return <CookieBanner />;
  },
};
