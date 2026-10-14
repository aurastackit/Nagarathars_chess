import QRCode from "qrcode";

/**
 * QR code as an SVG data URL, drawn on the server so nothing is sent to a
 * third-party QR service. The SVG carries its own white quiet zone.
 */
export async function qrDataUrl(text: string) {
  const svg = await QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
