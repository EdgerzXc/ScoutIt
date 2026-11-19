import { describe, expect, it } from "vitest";
import { authenticatorQrImage } from "../authenticatorQrImage";

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path fill="#000" d="M0 0h24v24H0z"/></svg>';
const expected = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

describe("authenticatorQrImage", () => {
  it.each([svg, `data:image/svg+xml;utf-8,${svg}`, expected])("normalizes supported QR image values", (value) => {
    expect(authenticatorQrImage(value)).toBe(expected);
  });

  it.each([null, "data:text/html,ordinary text", "https://example.invalid/qr.svg", "data:image/svg+xml,%3Csvg%zz"])(
    "rejects unexpected QR input without a remote request",
    (value) => expect(authenticatorQrImage(value)).toBe(""),
  );
});
