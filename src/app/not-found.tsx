import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <div className="info">
        <p className="eyebrow">404</p>
        <h1>This cup is empty.</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist.</p>
        <p style={{ marginTop: "1.5rem" }}>
          <Link href="/shop" className="btn btn--primary">
            Shop Caffix
          </Link>
        </p>
      </div>
    </div>
  );
}
