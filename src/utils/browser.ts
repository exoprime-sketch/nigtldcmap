export async function copyText(value: string): Promise<boolean> {
  if (!navigator.clipboard) return false;

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function copyCurrentUrl(): void {
  void copyText(window.location.href);
}

export function openExternalUrl(url: string): void {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function scrollToPageSection(target: string): boolean {
  const id = target.replace(/^#/, "").trim();
  if (!id) return false;

  const element = document.getElementById(id);
  if (!element) return false;

  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  if (element instanceof HTMLElement) {
    if (!element.hasAttribute("tabindex")) {
      element.setAttribute("tabindex", "-1");
      element.dataset.scrollFocusTemporary = "true";
      element.addEventListener(
        "blur",
        () => {
          if (element.dataset.scrollFocusTemporary === "true") {
            element.removeAttribute("tabindex");
            delete element.dataset.scrollFocusTemporary;
          }
        },
        { once: true }
      );
    }

    window.setTimeout(() => {
      element.focus({ preventScroll: true });
    }, 350);
  }

  return true;
}
