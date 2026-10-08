import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "@phosphor-icons/react";
import { useLoja } from "../../dados/loja.js";
import { useHoje } from "../../dados/seletores.js";
import { TIPOS } from "../../dominio/tipos.js";
import { somarDias } from "../../dominio/datas.js";
import "./listas.css";

export default function NovoServico() {
  const navigate = useNavigate();
  const hoje = useHoje();
  const clientes = useLoja((s) => s.dados.clientes);
  const criarServico = useLoja((s) => s.criarServico);
  const [c, setC] = useState({ clienteId: "", tipo: "pintura", descricao: "", prazo: somarDias(hoje, 7), duracao: "turno", prioridade: "normal" });
  const [erros, setErros] = useState({});
  const mudar = (k) => (e) => { setC({ ...c, [k]: e.target.value }); if (erros[k]) setErros({ ...erros, [k]: undefined }); };

  const salvar = (e) => {
    e.preventDefault();
    const r = criarServico(c);
    if (!r.ok) {
      setErros(r.erros);
      document.getElementById(`novo-${Object.keys(r.erros)[0]}`)?.focus();
      return;
    }
    navigate(`/servicos/${r.id}`, { state: { criado: true } });
  };

  const campo = (k, rotulo, controle, ajuda) => (
    <div className="campo">
      <label htmlFor={`novo-${k}`}>{rotulo}</label>
      {controle}
      {ajuda && !erros[k] && <span className="ajuda">{ajuda}</span>}
      {erros[k] && <span className="erro" id={`erro-${k}`}>{erros[k]}</span>}
    </div>
  );
  const err = (k) => ({ "aria-invalid": !!erros[k], "aria-describedby": erros[k] ? `erro-${k}` : undefined });

  return (
    <div className="form-tela">
      <button type="button" className="btn btn-fantasma" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Voltar</button>
      <div className="topo-tela"><div><h1>Novo serviço</h1><p>O pedido entra na lista A agendar da agenda.</p></div></div>
      <form className="form cartao" onSubmit={salvar} noValidate>
        {campo("clienteId", "Cliente", (
          <select id="novo-clienteId" value={c.clienteId} onChange={mudar("clienteId")} {...err("clienteId")}>
            <option value="">Escolha o cliente</option>
            {[...clientes].sort((a, b) => a.nome.localeCompare(b.nome)).map((x) => <option key={x.id} value={x.id}>{x.nome} · {x.bairro}</option>)}
          </select>
        ))}
        {campo("tipo", "Tipo de serviço", (
          <select id="novo-tipo" value={c.tipo} onChange={mudar("tipo")} {...err("tipo")}>
            {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        ))}
        {campo("descricao", "Descrição", <textarea id="novo-descricao" value={c.descricao} onChange={mudar("descricao")} placeholder="Ex.: Trocar torneira da copa do 2º andar" {...err("descricao")} />, "O que a equipe vai fazer, em uma frase.")}
        <div className="form-linha">
          {campo("prazo", "Prazo", <input id="novo-prazo" type="date" min={hoje} value={c.prazo} onChange={mudar("prazo")} {...err("prazo")} />)}
          {campo("duracao", "Duração", (
            <select id="novo-duracao" value={c.duracao} onChange={mudar("duracao")}>
              <option value="turno">Um turno (manhã ou tarde)</option><option value="dia">Dia inteiro</option>
            </select>
          ))}
          {campo("prioridade", "Prioridade", (
            <select id="novo-prioridade" value={c.prioridade} onChange={mudar("prioridade")}>
              <option value="normal">Normal</option><option value="urgente">Urgente</option>
            </select>
          ))}
        </div>
        <div className="form-acoes">
          <button type="button" className="btn btn-secundario" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn btn-primario">Criar serviço</button>
        </div>
      </form>
    </div>
  );
}
