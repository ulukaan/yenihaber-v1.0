import type { Meta, StoryObj } from "@storybook/react";
import { CookieSettings } from "./cookie-settings";

const meta: Meta<typeof CookieSettings> = {
  title: "Site/CookieSettings",
  component: CookieSettings,
};

export default meta;
type Story = StoryObj<typeof CookieSettings>;

export const Default: Story = {};
