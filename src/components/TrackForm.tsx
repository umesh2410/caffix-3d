"use client";

import { useState } from "react";

export default function TrackForm() {
  const [awb, setAwb] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="track-form"
      onSubmit={(e) => {
        e.preventDefault();
        const value = awb.replace(/\s/g, "");
        if (!/^\d{8,20}$/.test(value)) {
          setError("Enter the numeric waybill (AWB) number from your shipping message.");
          return;
        }
        setError("");
        window.open(`https://www.delhivery.com/track/package/${value}`, "_blank", "noopener,noreferrer");
      }}
    >
      <div className="field">
        <label htmlFor="awb">Waybill (AWB) number</label>
        <input
          id="awb"
          inputMode="numeric"
          autoComplete="off"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "awb-error" : undefined}
        />
        {error && (
          <p id="awb-error" className="field__error">
            {error}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn--primary">
        Track on Delhivery
      </button>
    </form>
  );
}
