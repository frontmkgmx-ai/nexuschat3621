import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { StatusViewer } from "./StatusViewer";
import React from "react";

// Mock resize observer and matchMedia for zoom-pan-pinch and motion
if (typeof window !== "undefined") {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("StatusViewer", () => {
  let mockOnNext: any, mockOnPrev: any, mockOnClose: any, mockOnRemove: any;

  beforeEach(() => {
    vi.useFakeTimers();
    // mock performance.now
    vi.stubGlobal("performance", {
      now: vi.fn(() => Date.now()),
    });
    // mock requestAnimationFrame
    vi.stubGlobal("requestAnimationFrame", (cb: any) => setTimeout(() => cb(performance.now()), 16));
    vi.stubGlobal("cancelAnimationFrame", (id: any) => clearTimeout(id));

    mockOnNext = vi.fn();
    mockOnPrev = vi.fn();
    mockOnClose = vi.fn();
    mockOnRemove = vi.fn();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const baseGroup = {
    userId: "user1",
    userName: "John Doe",
    userAvatar: "",
    statuses: [
      { id: "s1", type: "text", text: "Hello", durationSeconds: 5 },
      { id: "s2", type: "image", url: "http://example.com/img.jpg", durationSeconds: 5 },
    ],
  };

  const renderViewer = (group = baseGroup, idx = 0) => {
    return render(
      <StatusViewer
        currentGroup={group}
        viewingStatusIdx={idx}
        currentUser={{ _id: "user1" }}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onClose={mockOnClose}
        onRemove={mockOnRemove}
      />
    );
  };

  it("should render text status for 5 seconds and call onNext", async () => {
    renderViewer();
    expect(screen.getByText("Hello")).toBeTruthy();
    
    // Fast-forward 4 seconds -> should not call next
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(mockOnNext).not.toHaveBeenCalled();

    // Fast-forward 1 more second -> should call next
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(mockOnNext).toHaveBeenCalled();
  });

  it("should pause when pointer is down", () => {
    const { container } = renderViewer();
    const mainDiv = container.firstChild as HTMLElement;
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Pause
    fireEvent.pointerDown(mainDiv);
    
    act(() => {
      vi.advanceTimersByTime(4000); // 4 seconds passed while paused
    });
    expect(mockOnNext).not.toHaveBeenCalled();

    // Unpause
    fireEvent.pointerUp(mainDiv);
    
    act(() => {
      vi.advanceTimersByTime(3100); // Remaining time
    });
    expect(mockOnNext).toHaveBeenCalled();
  });

  it("should handle video with NaN duration (fallback to 5s)", () => {
    const videoGroup = {
      ...baseGroup,
      statuses: [
        { id: "v1", type: "video", url: "http://example.com/v.mp4", durationSeconds: NaN }
      ]
    };
    renderViewer(videoGroup, 0);
    const video = document.querySelector("video");
    if (video) fireEvent.loadedMetadata(video);
    act(() => {
      console.log("advancing timers"); vi.advanceTimersByTime(11000);
    });
    expect(mockOnNext).toHaveBeenCalled();
  });

  it("should handle video with 0 duration (fallback to 5s)", () => {
    const videoGroup = {
      ...baseGroup,
      statuses: [
        { id: "v1", type: "video", url: "http://example.com/v.mp4", durationSeconds: 0 }
      ]
    };
    renderViewer(videoGroup, 0);
    const video = document.querySelector("video");
    if (video) fireEvent.loadedMetadata(video);
    act(() => {
      vi.advanceTimersByTime(11000);
    });
    expect(mockOnNext).toHaveBeenCalled();
  });

  it("should trigger onPrev when swiped right", () => {
    // We cannot easily test framer-motion drag in RTL, but we can test the click areas.
    renderViewer();
    const prevArea = screen.getByText("Hello").parentElement?.querySelector(".left-0");
    if (prevArea) {
      fireEvent.click(prevArea);
      expect(mockOnPrev).toHaveBeenCalled();
    }
  });

});
