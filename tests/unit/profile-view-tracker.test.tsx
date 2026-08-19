import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileViewTracker } from "@/components/profile-view-tracker";

describe("profile view tracker", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("records one delayed view per profile during the browser session", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const view = render(<ProfileViewTracker slug="perfil-seguro-prueba" />);
    view.rerender(<ProfileViewTracker slug="perfil-seguro-prueba" />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/analytics/profile-views",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ slug: "perfil-seguro-prueba" }),
      }),
    );
  });
});
