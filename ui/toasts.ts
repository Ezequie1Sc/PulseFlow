export type Tone = "info" | "success" | "warning" | "error";
export class ToastKeys {
  private keys = new Set<string>();
  claim(key: string) {
    if (this.keys.has(key)) return false;
    this.keys.add(key);
    return true;
  }
  remove(key: string) {
    this.keys.delete(key);
  }
}
const icon = {
  info: "info",
  success: "circle-check",
  warning: "triangle-alert",
  error: "circle-x",
};
export function notifier(host: HTMLElement) {
  const keys = new ToastKeys();
  let previousSessionToast: (() => void) | undefined;
  return (message: string, tone: Tone = "info", group?: "exercise") => {
    if (!keys.claim(message)) return;
    if (group === "exercise") previousSessionToast?.();
    const row = document.createElement("div"),
      close = document.createElement("button"),
      text = document.createElement("span"),
      image = document.createElement("img");
    row.className = "toast";
    row.setAttribute("role", tone === "error" ? "alert" : "status");
    image.alt = "";
    image.src = "icons/" + icon[tone] + ".svg";
    text.textContent = message;
    close.textContent = "×";
    close.setAttribute("aria-label", "Dismiss notification");
    let timer: ReturnType<typeof setTimeout> | undefined;
    function dismiss() {
      clearTimeout(timer);
      row.remove();
      keys.remove(message);
      if (previousSessionToast === dismiss) previousSessionToast = undefined;
    }
    if (group === "exercise") previousSessionToast = dismiss;
    close.onclick = dismiss;
    row.append(image, text, close);
    host.append(row);
    if (tone !== "error") timer = setTimeout(dismiss, 5000);
  };
}
