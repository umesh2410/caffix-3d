import { ImageResponse } from "next/og";

// Home-screen icon for iOS: the same Caffix jar mark as icon.svg, drawn at 180px.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#120b07",
        }}
      >
        <div
          style={{
            width: 74,
            height: 30,
            borderRadius: 10,
            background: "#1d1612",
            border: "5px solid #d9a35b",
          }}
        />
        <div
          style={{
            marginTop: 6,
            width: 84,
            height: 82,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(180deg, #e2b06c, #9a6131)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f4ead9",
            }}
          >
            <div style={{ width: 50, height: 11, borderRadius: 6, background: "#2b1a10" }} />
          </div>
        </div>
      </div>
    ),
    size
  );
}
