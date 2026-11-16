# Logs de auditoria no Grafana Cloud

O Loki roda dentro do container do backend. O Grafana Cloud lê esses logs pela própria URL da API,
na rota `/loki/api/v1/*`, que o Caddy protege com usuário e senha. De fora só é possível **ler**:
gravar (`push`) e apagar (`delete`) logs são bloqueados.

## 1. Senha no Render

No serviço `nawszera-notus-api` → **Environment**, crie `LOKI_PASSWORD` com uma senha longa
(por exemplo, a saída de `openssl rand -base64 24`) e salve. O Render faz um novo deploy.
O usuário é `grafana` (para trocar, crie também `LOKI_USER`).

## 2. Fonte de dados no Grafana Cloud

1. Crie a conta grátis em https://grafana.com e abra o seu Grafana (`https://<seu-stack>.grafana.net`).
2. **Connections → Data sources → Add data source → Loki**.
3. Preencha:
   - **Name:** `Loki NOTUS`
   - **URL:** `https://nawszera-notus-api.onrender.com` (sem `/loki` no final)
   - **Authentication → Basic authentication:** usuário `grafana`, senha = `LOKI_PASSWORD`
4. **Save & test**. Se a API estiver dormindo (plano grátis), o primeiro teste pode demorar
   ou falhar: espere uns 2 minutos e teste de novo.

## 3. Painel

**Dashboards → New → Import → Upload dashboard JSON file**, escolha `painel-auditoria.json`
e, em **Loki do NOTUS**, selecione a fonte `Loki NOTUS`.

O painel mostra: total de requisições, erros 4xx/5xx, tempo de resposta p95 (RNF9), usuários
distintos, requisições por status ao longo do tempo, usuários e IPs com mais requisições,
acessos negados por rota e o registro completo (usuário · IP · método rota · status · tempo).
Os campos no topo filtram por e-mail, IP e status.

## Limitações (plano grátis do Render)

- O disco do container é temporário: o Loki começa vazio a cada deploy ou reinício.
  A retenção de 6 meses (RNF7) só vale com um disco persistente montado em `/loki` (plano pago).
- Os logs chegam ao Loki em lotes, a cada ~1 minuto.
