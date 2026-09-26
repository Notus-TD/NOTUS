import { ATUALIZADO_EM, Destaque, Secao, VERSAO_DOCUMENTOS } from "@/components/LegalPage";

export function PolicyContent() {
  return (
    <div className="space-y-10">
      <Secao titulo="1. Sobre esta política">
        <p>
          Esta política explica quais dados pessoais o NOTUS usa, para quê, por quanto tempo e
          quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº
          13.709/2018). Versão {VERSAO_DOCUMENTOS}, atualizada em {ATUALIZADO_EM}.
        </p>
        <p>
          O NOTUS é um projeto acadêmico. O responsável pelos dados (controlador) é a escola que usa
          o sistema — neste protótipo, o Colégio Notus, uma escola fictícia.
        </p>
      </Secao>

      <Secao titulo="2. Quais dados usamos e por quê">
        <ul className="list-disc space-y-3 pl-6">
          <li>
            <Destaque>Conta de acesso</Destaque> (e-mail, senha e perfil): para você entrar no
            portal e ver apenas o que o seu perfil permite.
          </li>
          <li>
            <Destaque>Aluno</Destaque> (nome, e-mail, matrícula, data de nascimento e turma): para
            identificar o aluno e organizar a vida escolar.
          </li>
          <li>
            <Destaque>Responsável</Destaque> (nome, e-mail e telefone): para identificar o
            responsável legal, vinculá-lo aos alunos, permitir o contato da escola e enviar avisos
            automáticos por e-mail (seção 6).
          </li>
          <li>
            <Destaque>Professor</Destaque> (e-mail e turmas em que leciona): para lançar notas,
            faltas e atividades.
          </li>
          <li>
            <Destaque>Dados acadêmicos</Destaque> (notas, boletins, frequência e atividades): para o
            acompanhamento escolar pelo aluno, pelo responsável e pelos professores.
          </li>
          <li>
            <Destaque>Registros de acesso</Destaque> (usuário, IP, data, hora e ação realizada):
            para segurança e para saber quem alterou notas, presenças e cadastros. Não registramos
            senhas.
          </li>
        </ul>
        <p>
          <Destaque>Base legal:</Destaque> o uso desses dados é necessário para a prestação do
          serviço educacional (Art. 7º, V) e para cumprir obrigações legais, como a guarda de
          registros escolares e de registros de acesso (Art. 7º, II). O aceite no primeiro acesso
          confirma que você leu esta política e os Termos de Uso; ele não é a base legal para o
          tratamento, exceto no caso dos dados de menores, explicado na seção 3.
        </p>
        <p>
          Não coletamos dados sensíveis (como saúde ou biometria), CPF, endereço, localização,
          fotos ou dados financeiros.
        </p>
      </Secao>

      <Secao titulo="3. Crianças e adolescentes">
        <p>
          Os dados de alunos menores de idade são tratados sempre no melhor interesse do aluno (Art.
          14 da LGPD). As contas são criadas pela escola, o responsável vê apenas os alunos
          vinculados a ele, e as notas não são expostas a outros alunos nem usadas para publicidade.
        </p>
        <p>
          <Destaque>Aviso aos responsáveis:</Destaque> o tratamento dos dados de menores de idade
          depende do consentimento específico de pelo menos um dos pais ou do responsável legal
          (Art. 14, §1º). Esse consentimento é dado pelo responsável no primeiro acesso, ao aceitar
          esta política e os Termos de Uso, e pode ser retirado a qualquer momento pedindo à
          secretaria. Retirá-lo pode impedir a continuidade do uso do portal, mas não apaga os
          registros escolares que a lei exige guardar.
        </p>
      </Secao>

      <Secao titulo="4. Quem acessa">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <Destaque>Aluno:</Destaque> apenas os próprios dados: cadastro, notas, boletins,
            faltas, frequência, atividades e entregas. Não vê dados de outros alunos.
          </li>
          <li>
            <Destaque>Responsável:</Destaque> o próprio cadastro e os mesmos dados acadêmicos dos
            alunos vinculados a ele. Não vê outros alunos.
          </li>
          <li>
            <Destaque>Professor:</Destaque> nome, matrícula e situação da matrícula dos alunos das
            turmas em que leciona. Lança notas, faltas, presenças e aulas somente nas disciplinas
            que leciona em cada turma. Não vê e-mail, telefone nem os dados do responsável.
          </li>
          <li>
            <Destaque>Administração (secretaria):</Destaque> os cadastros de alunos, responsáveis e
            professores, as turmas, disciplinas, notas e frequência, e o histórico dos avisos por
            e-mail. Também atende os pedidos sobre dados pessoais e anonimiza contas quando cabível.
          </li>
          <li>
            <Destaque>Equipe técnica:</Destaque> acessa o servidor, o banco de dados e os
            registros de acesso apenas para manutenção, correção de erros e segurança.
          </li>
        </ul>
        <p>
          Essas permissões são verificadas pelo servidor em cada operação, e os acessos ficam
          registrados (seção 2, "Registros de acesso").
        </p>
      </Secao>

      <Secao titulo="5. Compartilhamento">
        <p>
          Não vendemos dados pessoais. Os dados ficam no servidor e no banco de dados do sistema, e
          os registros de acesso ficam em ferramentas de log (Loki e Grafana) na mesma
          infraestrutura. Há duas exceções, e em ambas os dados podem ser processados fora do
          Brasil:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <Destaque>Google Fonts:</Destaque> fornece as fontes do site e recebe o seu IP ao
            carregar a página.
          </li>
          <li>
            <Destaque>Resend (serviço de envio de e-mails):</Destaque> recebe o e-mail do responsável
            e o conteúdo de cada aviso para entregá-lo por e-mail (seção 6).
          </li>
        </ul>
        <p>Dados só são entregues a autoridades quando exigido por lei.</p>
      </Secao>

      <Secao titulo="6. Avisos por e-mail">
        <p>
          O Colégio Notus envia avisos automáticos para o e-mail cadastrado do responsável, sobre os
          alunos vinculados a ele, quando:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>o aluno recebe uma falta;</li>
          <li>o boletim de um período é fechado;</li>
          <li>uma nova atividade é publicada para a turma do aluno.</li>
        </ul>
        <p>
          Os avisos só começam depois que o responsável aceita esta política e os Termos de Uso no
          primeiro acesso ao portal. Esse aceite vale como a sua autorização para receber os avisos
          por e-mail.
        </p>
        <p>
          Cada aviso leva apenas o necessário: primeiro nome do responsável e do aluno, disciplina,
          data e, conforme o caso, o total de faltas, a média do boletim ou o título e o prazo da
          atividade. Os e-mails são automáticos e as respostas não são lidas; dúvidas devem ser
          tratadas com a secretaria.
        </p>
        <p>
          Para deixar de receber os avisos, basta pedir à secretaria. Guardamos um registro de cada
          aviso (tipo, data, situação do envio, identificador da mensagem e os dados usados no
          aviso) para suporte e auditoria, pelo prazo indicado na seção 8.
        </p>
      </Secao>

      <Secao titulo="7. Armazenamento no navegador">
        <p>Não usamos cookies. O navegador guarda apenas:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>a sua sessão, apagada ao sair ou em até 1 hora;</li>
          <li>
            o seu e-mail, só se você marcar "Lembrar meu e-mail neste dispositivo" ao entrar. A
            senha nunca é guardada. Para apagar o e-mail, desmarque a opção no próximo acesso ou
            limpe os dados do navegador. Evite marcar essa opção em computadores compartilhados;
          </li>
          <li>a indicação de que você já viu o aviso de privacidade;</li>
          <li>
            no perfil de administração, os comunicados enviados, que neste protótipo ficam salvos
            só no navegador de quem os enviou.
          </li>
        </ul>
      </Secao>

      <Secao titulo="8. Por quanto tempo guardamos">
        <p>
          Os prazos abaixo são definidos para este protótipo acadêmico. Em uma implantação real,
          a escola os ajustaria conforme a norma do seu sistema de ensino.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <Destaque>Cadastros:</Destaque> enquanto durar o vínculo com a escola e por 5 anos
            depois do seu término. Depois desse prazo, ou a pedido do titular quando cabível, são
            anonimizados em até 30 dias.
          </li>
          <li>
            <Destaque>Dados acadêmicos</Destaque> (notas, boletins, frequência e atividades): 5
            anos após o término do vínculo. Depois, são eliminados ou anonimizados.
          </li>
          <li>
            <Destaque>Registros de acesso:</Destaque> 6 meses (Marco Civil da Internet, Art. 15),
            e depois são apagados.
          </li>
          <li>
            <Destaque>Registros de avisos por e-mail:</Destaque> 6 meses após o envio, e
            depois são apagados.
          </li>
          <li>
            <Destaque>Cópias de segurança:</Destaque> seguem os mesmos prazos e são descartadas
            no ciclo de rotação, em até 30 dias após a eliminação do dado original.
          </li>
        </ul>
      </Secao>

      <Secao titulo="9. Seus direitos">
        <p>
          Você (ou seu responsável legal) pode pedir: acesso aos seus dados, correção, informação
          sobre compartilhamento, anonimização ou eliminação, e uma cópia dos seus dados
          (portabilidade). Basta solicitar à secretaria da escola, que responde em até 15 dias.
          Alguns dados podem ser mantidos quando a lei exigir, como os registros escolares.
        </p>
      </Secao>

      <Secao titulo="10. Segurança e incidentes">
        <p>
          As senhas são guardadas com criptografia (hash), o acesso expira automaticamente e cada
          perfil só acessa o que precisa. Se houver um incidente de segurança com risco aos
          titulares, a escola comunica a ANPD e as pessoas afetadas.
        </p>
      </Secao>

      <Secao titulo="11. Alterações e contato">
        <p>
          Mudanças importantes nesta política serão avisadas no portal. Dúvidas ou pedidos sobre
          seus dados: secretaria da escola, pelo e-mail secretaria@colegionotus.com.br. Você também
          pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
        <p>
          Como o Colégio Notus é fictício, o e-mail de contato e a figura do encarregado (DPO) são
          ilustrativos neste protótipo. Em uma implantação real, a escola deveria indicar um
          encarregado e um canal de atendimento funcionais.
        </p>
      </Secao>
    </div>
  );
}
