import Link from "next/link";
import { formatINR, FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";

export default function AnnouncementBar() {
  return (
    <div className="announce">
      <p>
        Free shipping on orders above {formatINR(FREE_DELIVERY_THRESHOLD)}
        <span aria-hidden="true"> · </span>
        Use code <strong>CHILL10</strong> for 10% off
      </p>
      <Link href="/shop" className="announce__cta">
        Shop now
      </Link>
    </div>
  );
}
