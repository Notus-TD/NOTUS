import type { ReactNode } from "react";

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-foreground">{titulo}</h2>
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function PolicyContent() {
  return (
    <div className="space-y-10">
      <Secao titulo="1. Escopo">
        <p>
          Esta política explica como o NOTUS trata os dados pessoais de alunos, responsáveis e
          professores que usam o portal — site e futuros aplicativos — para acompanhar matrícula,
          notas, presença, atividades e comunicação com a escola.
        </p>
      </Secao>

      <Secao titulo="2. Definições">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-foreground">Titular:</strong> a pessoa a quem os dados pessoais
            se referem (aluno, responsável ou professor).
          </li>
          <li>
            <strong className="text-foreground">Controlador:</strong> quem decide como e para quê os
            dados são tratados — no caso, [Razão Social do Colégio].
          </li>
          <li>
            <strong className="text-foreground">Encarregado (DPO):</strong> canal de contato entre
            os titulares e o Controlador para assuntos de proteção de dados.
          </li>
          <li>
            <strong className="text-foreground">Tratamento:</strong> qualquer operação com dados
            pessoais — coleta, uso, armazenamento, correção ou eliminação.
          </li>
          <li>
            <strong className="text-foreground">Anonimização:</strong> processo que remove a
            possibilidade de associar um dado a uma pessoa identificável.
          </li>
        </ul>
      </Secao>

      <Secao titulo="3. Controlador e Encarregado">
        <p>
          <strong className="text-foreground">Controlador:</strong> [Razão Social do Colégio], CNPJ
          [00.000.000/0000-00], com sede em [endereço completo].
        </p>
        <p>
          <strong className="text-foreground">Encarregado (DPO):</strong> dúvidas, solicitações ou
          reclamações sobre o tratamento de dados podem ser enviadas para{" "}
          <a href="mailto:privacidade@colegionotus.com.br" className="text-primary underline">
            privacidade@colegionotus.com.br
          </a>
          .
        </p>
      </Secao>

      <Secao titulo="4. Dados de crianças e adolescentes">
        <p>
          Grande parte dos alunos atendidos pelo NOTUS são crianças e adolescentes. Nesses casos, o
          tratamento observa o Art. 14 da LGPD: os dados são coletados no melhor interesse do aluno,
          e o consentimento é obtido do responsável legal, que também autoriza, em nome do aluno, o
          tratamento necessário para a prestação do serviço educacional (matrícula, notas,
          frequência e comunicação escolar).
        </p>
      </Secao>

      <Secao titulo="5. Dados tratados e finalidade">
        <p>Coletamos apenas os dados necessários para operar o portal escolar:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-foreground">Do aluno:</strong> nome completo, e-mail, matrícula,
            data de nascimento e status da matrícula — para identificação, login e controle
            acadêmico.
          </li>
          <li>
            <strong className="text-foreground">Do responsável:</strong> nome, e-mail, CPF, telefone
            e endereço — para contato da escola e vínculo com o(s) aluno(s).
          </li>
          <li>
            <strong className="text-foreground">Do professor:</strong> nome e e-mail — para login e
            registro de quem lançou notas, faltas e atividades.
          </li>
          <li>
            <strong className="text-foreground">Dados acadêmicos:</strong> notas, boletins,
            frequência/faltas e atividades — para acompanhamento pedagógico do aluno pelo próprio
            aluno, pelo responsável e pelos professores.
          </li>
          <li>
            <strong className="text-foreground">Dados de acesso:</strong> senha (armazenada com hash
            criptográfico, nunca em texto puro) e registro de aceite dos termos — para autenticação
            e segurança da conta.
          </li>
        </ul>
      </Secao>

      <Secao titulo="6. Base legal">
        <p>O tratamento se apoia principalmente em duas hipóteses do Art. 7º da LGPD:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-foreground">Consentimento</strong> (inciso I): obtido do
            responsável ou do próprio titular maior de idade no momento do primeiro acesso ao
            portal.
          </li>
          <li>
            <strong className="text-foreground">Execução de contrato</strong> (inciso V): dados
            necessários à prestação do serviço educacional contratado junto à escola, como
            matrícula, notas e frequência.
          </li>
        </ul>
      </Secao>

      <Secao titulo="7. Direitos do titular">
        <p>A qualquer momento, o titular (ou seu responsável legal) pode solicitar:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Confirmação da existência de tratamento e acesso aos dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Informação sobre com quem os dados são compartilhados;</li>
          <li>Revogação do consentimento dado anteriormente;</li>
          <li>
            <strong className="text-foreground">
              Anonimização, bloqueio ou eliminação de dados
            </strong>{" "}
            desnecessários ou tratados em desconformidade com a lei — no NOTUS, essa solicitação é
            atendida pela funcionalidade de anonimização disponível para a administração da escola,
            que substitui os dados pessoais identificáveis e encerra a matrícula vinculada.
          </li>
        </ul>
        <p>
          Solicitações podem ser feitas pelo canal indicado na seção 3 (Encarregado) ou diretamente
          à secretaria da escola.
        </p>
      </Secao>

      <Secao titulo="8. Compartilhamento de dados">
        <p>
          O NOTUS não compartilha dados pessoais com terceiros para fins comerciais. Os dados ficam
          restritos à equipe escolar (professores, coordenação e administração) com acesso
          necessário para exercer suas funções, e ao próprio aluno e responsável vinculados. Dados
          podem ser divulgados a autoridades públicas apenas quando exigido por lei ou ordem
          judicial.
        </p>
      </Secao>

      <Secao titulo="9. Retenção e eliminação">
        <p>
          Os dados são mantidos enquanto durar o vínculo do aluno com a escola e pelo prazo
          adicional necessário para cumprir obrigações legais de guarda de registro escolar. Após
          esse período, ou mediante solicitação válida do titular, os dados pessoais são
          anonimizados.
        </p>
      </Secao>

      <Secao titulo="10. Segurança">
        <p>
          Adotamos medidas técnicas para proteger os dados pessoais, incluindo senhas armazenadas
          com hash criptográfico (nunca em texto puro), autenticação por token com expiração e
          controle de acesso por perfil (aluno, responsável, professor, administração). Nenhum
          sistema é 100% livre de risco, mas trabalhamos para reduzir essas vulnerabilidades
          continuamente.
        </p>
      </Secao>

      <Secao titulo="11. Armazenamento local no navegador">
        <p>
          O NOTUS não usa cookies de rastreamento. Guardamos localmente no seu navegador
          (localStorage) apenas o token de sessão necessário para manter você conectado — esse dado
          não é compartilhado com terceiros e é apagado quando você sai da conta ou o token expira.
        </p>
      </Secao>

      <Secao titulo="12. Alterações nesta política">
        <p>
          Podemos atualizar esta política para refletir mudanças no portal ou na legislação. A data
          no topo desta página indica a versão vigente; mudanças relevantes serão comunicadas aos
          usuários no próprio portal.
        </p>
      </Secao>

      <Secao titulo="13. Contato">
        <p>
          Dúvidas, solicitações ou reclamações sobre esta política:{" "}
          <a href="mailto:privacidade@colegionotus.com.br" className="text-primary underline">
            privacidade@colegionotus.com.br
          </a>{" "}
          ou secretaria@colegionotus.com.br · (11) 4002-8922. Sem prejuízo desse canal, o titular
          pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </Secao>
    </div>
  );
}
