'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const key = `scroll-${pathname}`;

    // ✅ step 1: restore หลังจาก DOM พร้อมแน่ ๆ
    const restoreScroll = () => {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        requestAnimationFrame(() => {
          // ใช้ setTimeout หน่วงเล็กน้อยเพื่อให้ layout เสร็จ
          setTimeout(() => {
            window.scrollTo({
              top: parseInt(saved, 10),
              behavior: "instant", // ถ้าอยากให้เลื่อนนุ่ม ๆ -> เปลี่ยนเป็น "smooth"
            });
          }, 50);
        });
      }
    };

    // ✅ step 2: พยายาม restore ทั้งตอน mount และหลังจาก DOM โหลดเสร็จ
    restoreScroll();
    window.addEventListener("load", restoreScroll);

    // ✅ step 3: บันทึก scroll ทุกครั้งที่มีการเลื่อน
    const handleScroll = () => {
      sessionStorage.setItem(key, window.scrollY.toString());
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("load", restoreScroll);
    };
  }, [pathname]);

  return null;
}
