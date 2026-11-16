import { ShieldCheck } from "lucide-react";
import { Painel } from "@/components/layout/LayoutAdmin";

// Direitos do titular (LGPD, art. 18): o pedido é feito à secretaria, que consulta, exporta, corrige ou
// anonimiza os dados pelo painel do administrador. Cada ação fica registrada na auditoria.
export function PrivacidadeResponsavel() {
  return (
    <Painel titulo="Seus dados pessoais" icone={ShieldCheck}>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          Você pode pedir, a qualquer momento, uma cópia dos seus dados e dos dados dos seus filhos,
          a correção de alguma informação ou a anonimização do cadastro.
        </p>
        <p>
          Faça o pedido diretamente na{" "}
          <strong className="text-foreground">secretaria da escola</strong>. A secretaria atende
          pelo painel do NOTUS e entrega os dados em formato digital (JSON). Toda consulta,
          exportação ou anonimização fica registrada.
        </p>
        <p>
          A anonimização só é possível depois que nenhum filho tiver matrícula ativa, porque o
          histórico escolar precisa ser guardado (LGPD, art. 16).
        </p>
      </div>
    </Painel>
  );
}
