"use client";

import { useEffect, useState } from "react";
import styles from "./site-footer.module.css";

function message(code: string | null): string | null {
  switch (code) {
    case "onay":
      return "Kayıt alındı. Aboneliği tamamlamak için e-postanızdaki onay linkine tıklayın.";
    case "zaten":
      return "Bu e-posta zaten abone.";
    case "kvkk":
      return "Devam etmek için KVKK onay kutusu zorunlu.";
    case "hata":
      return "Kayıt yapılamadı. Lütfen daha sonra tekrar deneyin.";
    default:
      return null;
  }
}

/** Form redirect sonrası ?bulten= durum mesajı */
export function BultenFlash() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("bulten");
    setText(message(code));
  }, []);

  if (!text) return null;
  return (
    <p className={styles.flash} role="status">
      {text}
    </p>
  );
}
