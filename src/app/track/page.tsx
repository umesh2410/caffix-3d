import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import TrackForm from "@/components/TrackForm";
import { BRAND } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track your Caffix parcel with the Delhivery waybill number from your SMS or WhatsApp update.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <>
      <PageHero
        eyebrow="Live order tracking"
        title="Track your"
        accent="order."
        lede="As soon as your package leaves our roastery, you receive a tracking link via SMS and WhatsApp. Enter the Delhivery waybill (AWB) number from that message to follow your parcel."
      />
      <div className="page page--after-hero">
        <article className="info">
          <TrackForm />
          <section>
            <h2>Can&apos;t find your waybill?</h2>
            <p>
              Email {BRAND.email} or call {BRAND.phone} with your order ID and we&apos;ll share it.
            </p>
          </section>
        </article>
      </div>
    </>
  );
}
