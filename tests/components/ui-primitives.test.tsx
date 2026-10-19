import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GridPattern } from "@/components/ui/grid-pattern";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

describe("source-owned visual primitives", () => {
  it("renders the interactive control as a safe button", () => {
    render(<InteractiveHoverButton>Create course</InteractiveHoverButton>);

    expect(screen.getByRole("button", { name: /create course/i })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("keeps the decorative grid out of the accessibility tree", () => {
    const { container } = render(<GridPattern />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
