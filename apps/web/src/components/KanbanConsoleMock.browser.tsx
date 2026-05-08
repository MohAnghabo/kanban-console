import "../index.css";

import { page, userEvent } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { SidebarProvider } from "./ui/sidebar";
import { KanbanConsoleMock } from "./KanbanConsoleMock";

describe("KanbanConsoleMock", () => {
  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("renders the mock board and toggles Arabic RTL mode", async () => {
    const screen = await render(
      <SidebarProvider defaultOpen={false}>
        <KanbanConsoleMock />
      </SidebarProvider>,
    );

    try {
      await expect
        .element(page.getByRole("heading", { name: "Kanban Project Console" }))
        .toBeInTheDocument();
      await expect
        .element(page.getByRole("heading", { exact: true, name: "GitHub Projects board" }))
        .toBeInTheDocument();

      const views = [
        ["Git", "Lazygit-style git status"],
        ["Artifacts", "Product artifacts"],
        ["PRs", "PR watcher"],
        ["Timeline", "Issue and PR timeline"],
        ["CLI", "CLI command console"],
        ["GitOps", "GitOps and release dashboard"],
        ["Settings", "Console settings"],
        ["States", "State previews"],
      ] as const;

      for (const [buttonName, headingName] of views) {
        await page.getByRole("button", { exact: true, name: buttonName }).click();
        await expect
          .element(page.getByRole("heading", { exact: true, name: headingName }))
          .toBeInTheDocument();
      }

      await page.getByRole("button", { exact: true, name: "PRs" }).click();
      await expect.element(page.getByText("Polling interval").first()).toBeInTheDocument();
      await expect.element(page.getByText("Suggested fixes").first()).toBeInTheDocument();
      await expect.element(page.getByText("Duplicate suppressed").first()).toBeInTheDocument();

      await page.getByRole("button", { exact: true, name: "Artifacts" }).click();
      await page.getByRole("button", { name: /docs\/product\/project-console\.md/u }).click();
      await page.getByLabelText("Artifact markdown editor").fill("# Product artifact\n\nUpdated.");
      await page.getByRole("button", { exact: true, name: "Apply guarded patch" }).click();
      await expect
        .element(page.getByText("Clean artifact is ready for guarded patch flow."))
        .toBeInTheDocument();

      await page.getByRole("button", { exact: true, name: "AR" }).click();

      await expect
        .element(page.getByRole("heading", { name: "وحدة تحكم مشروع كانبان" }))
        .toBeInTheDocument();
      expect(document.querySelector("[dir='rtl']")).not.toBeNull();
    } finally {
      await screen.unmount();
    }
  });

  it("keeps daily-use navigation keyboard reachable across main views", async () => {
    const screen = await render(
      <SidebarProvider defaultOpen={false}>
        <KanbanConsoleMock />
      </SidebarProvider>,
    );

    try {
      const buttonNames = Array.from(document.querySelectorAll("button")).map(
        (button) => button.textContent?.trim() || button.getAttribute("aria-label") || "",
      );
      expect(buttonNames.every((name) => name.length > 0)).toBe(true);

      async function tabToButton(name: string) {
        for (let attempt = 0; attempt < 40; attempt += 1) {
          await userEvent.tab();
          const focused = document.activeElement;
          if (focused instanceof HTMLButtonElement && focused.textContent?.trim() === name) {
            return focused;
          }
        }

        throw new Error(`Button ${name} was not reachable by tab navigation`);
      }

      const gitButton = await tabToButton("Git");
      expect(document.activeElement).toBe(gitButton);
      await userEvent.keyboard("{Enter}");
      await expect
        .element(page.getByRole("heading", { exact: true, name: "Lazygit-style git status" }))
        .toBeInTheDocument();

      const gitOpsButton = await tabToButton("GitOps");
      expect(document.activeElement).toBe(gitOpsButton);
      await userEvent.keyboard("{Enter}");
      await expect
        .element(page.getByRole("heading", { exact: true, name: "GitOps and release dashboard" }))
        .toBeInTheDocument();

      const localeButton = await tabToButton("AR");
      expect(document.activeElement).toBe(localeButton);
      await userEvent.keyboard("{Enter}");
      await expect
        .element(page.getByRole("heading", { exact: true, name: "لوحة GitOps والإصدارات" }))
        .toBeInTheDocument();
      expect(document.querySelector("[dir='rtl']")).not.toBeNull();
    } finally {
      await screen.unmount();
    }
  });
});
