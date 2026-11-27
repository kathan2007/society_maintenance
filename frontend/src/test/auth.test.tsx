import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";

// Smoke test — just verifies the app doesn't crash
describe("AuthContext", () => {
  it("provides auth context without crashing", () => {
    const TestChild = () => <div data-testid="ok">loaded</div>;
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId("ok")).toBeInTheDocument();
  });
});
