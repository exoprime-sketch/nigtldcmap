import { scrollToPageSection } from "../../utils/browser";
import "../../styles/evidence-navigation-v40.css";

interface PageJumpNavV39Item {
  id: string;
  label: string;
}

interface PageJumpNavV39Props {
  items: PageJumpNavV39Item[];
  label?: string;
}

export default function PageJumpNavV39({
  items,
  label = "페이지 빠른 이동",
}: PageJumpNavV39Props) {
  return (
    <nav className="page-jump-v39" aria-label={label}>
      <span>바로가기</span>
      <div>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToPageSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
