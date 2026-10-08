// Painel de embarque com os números do dia (Split-Flap do React Bits). Monta só quando aparece.
import { useEffect, useState } from "react";
import SplitFlapText from "./rb/SplitFlapText.jsx";

export default function PainelEmbarque({ frases }) {
  const [tamanho, setTamanho] = useState(40);
  useEffect(() => {
    const m = matchMedia("(max-width: 640px)");
    const f = () => setTamanho(m.matches ? 17 : 40);
    f(); m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return (
    <div className="painel-embarque" aria-label={frases.join(". ")} role="img">
      <SplitFlapText words={frases} loop cycleDelay={2600} flipDuration={0.09} stagger={0.035} flipsPerChar={6}
        charset="ABCDEFGHIJKLMNOPQRSTUVWXYZÇÃÕÉ0123456789%" tileColor="#18181B" textColor="#FAFAF9" tileRadius={6} gap={4}
        fontSize={tamanho} padTo={18} />
    </div>
  );
}
