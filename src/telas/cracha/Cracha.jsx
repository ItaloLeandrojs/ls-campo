// Crachá 3D (carregado sob demanda). Só é importado depois que a pessoa escolhe a equipe.
import { useEffect, useState } from "react";
import Lanyard from "./rb/Lanyard.jsx";
import { frenteDoCracha, cordao } from "./arte.js";

export default function Cracha({ equipe }) {
  const [frente, setFrente] = useState(null);
  const [fita] = useState(() => cordao());
  useEffect(() => { let vivo = true; frenteDoCracha(equipe).then((u) => vivo && setFrente(u)); return () => { vivo = false; }; }, [equipe]);
  if (!frente) return <div className="cracha-palco" aria-hidden="true" />;
  return (
    <div className="cracha-palco" role="img" aria-label={`Crachá da equipe ${equipe.nome}, líder ${equipe.lider}. Dá para puxar com o dedo ou o mouse.`}>
      <Lanyard position={[0, 0, 13]} gravity={[0, -40, 0]} frontImage={frente} lanyardImage={fita} lanyardWidth={1} />
    </div>
  );
}
