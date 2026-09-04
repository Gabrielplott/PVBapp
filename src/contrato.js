import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { planoInfo } from "./planos";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function dataPorExtenso(date = new Date()) {
  return `${String(date.getDate()).padStart(2, "0")} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

// Junta os dias que a aluna frequenta com o horário correspondente da turma,
// agrupando dias que têm o mesmo horário. Ex: "Terça e Quinta, das 16h às 17h"
export function diasHorariosAluna(aluna, turma) {
  if (!turma) return "";
  const horariosTurma = turma.horarios || [];
  const dias = aluna.diasFrequenta && aluna.diasFrequenta.length
    ? aluna.diasFrequenta
    : horariosTurma.map((h) => h.dia);

  const porHorario = {};
  const ordem = [];
  dias.forEach((dia) => {
    const h = horariosTurma.find((x) => x.dia === dia);
    const horario = h ? h.horario.trim() : "";
    if (!porHorario[horario]) {
      porHorario[horario] = [];
      ordem.push(horario);
    }
    porHorario[horario].push(dia);
  });

  return ordem
    .map((horario) => {
      const diasStr = porHorario[horario].join(" e ");
      return horario ? `${diasStr}, das ${horario}` : diasStr;
    })
    .join("; ");
}

// Gera o docx do contrato preenchido a partir do modelo em /public/templates.
// Retorna um Blob pronto para download.
export async function gerarContratoBlob(aluna, turma) {
  const resp = await fetch("/templates/contrato-modelo.docx");
  if (!resp.ok) throw new Error("Não foi possível carregar o modelo de contrato.");
  const arrayBuffer = await resp.arrayBuffer();

  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" }, // o modelo usa {{campo}}, não o {campo} padrão do docxtemplater
    nullGetter: () => "", // campos sem dado (ex: CPF) saem em branco, sem quebrar a geração
  });

  doc.render({
    nome_contratante: aluna.responsavel || "",
    cpf_contratante: aluna.cpfResponsavel || "",
    endereco_contratante: aluna.endereco || "",
    nome_aluna: aluna.nome || "",
    dias_horarios_turma: diasHorariosAluna(aluna, turma),
    plano: planoInfo(aluna.plano).label,
    data_assinatura: dataPorExtenso(),
  });

  return doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function baixarBlob(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function gerarEBaixarContrato(aluna, turma) {
  const blob = await gerarContratoBlob(aluna, turma);
  const nomeArquivo = `Contrato - ${aluna.nome || "aluna"}.docx`;
  baixarBlob(blob, nomeArquivo);
}
