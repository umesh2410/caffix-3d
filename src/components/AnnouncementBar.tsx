import Link from "next/link";
import { formatINR, FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";

export default function AnnouncementBar() {
  return (
    <div className="announce">
      {/* Phones drop the "extra" words so the whole offer fits on one line. */}
      <p>
        Free shipping <span className="announce__extra">on orders </span>above {formatINR(FREE_DELIVERY_THRESHOLD)}
        <span className="announce__code">
          <span aria-hidden="true"> · </span>
          <span className="announce__extra">Use code </span>
          <strong>CHILL10</strong> for 10% off
        </span>
      </p>
      <Link href="/shop" className="announce__cta">
        Shop now
      </Link>
    </div>
  );
}
