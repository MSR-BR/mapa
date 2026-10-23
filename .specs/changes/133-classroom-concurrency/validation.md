# Validação — 23/10/2026

Estado: IMPLEMENTED_LOCAL_PARTIAL. O controle da rota autenticada de sugestões passou a usar o identificador verificado da conta, não o IP comum da sala. Teste com 50 contas sintéticas no mesmo IP: todas recebem acesso independente; uma conta que excede o limite momentâneo não bloqueia as demais.

O harness de descoberta simula 50 pedidos simultâneos para **o mesmo projeto**: uma geração e uma gravação, 49 respostas de conflito, sem duplicação; casos de claim expirada e falha de gravação mantêm recuperação/rascunho. O PostgreSQL local da C129 testa 50 reservas e 50 liquidações simultâneas, sem dupla devolução. Essas são verificações sintéticas de fronteiras específicas, não 50 mapas completos em paralelo.

HTTP429 do provedor conserva `Retry-After` quando presente; a resposta informa espera limitada pelo provedor sem repetir a geração automaticamente. Cota financeira interna, cota do provedor e timeout têm mensagens diferentes. Faltam RPM/TPM/RPD reais, carga representativa em ambiente de teste e taxa de conclusão. O controle de 15/min por usuário desta rota opcional é por instância; nenhum limite diário de projetos foi introduzido.

Testes: `tests/ai-classroom-capacity.test.ts`, `scripts/verify-discovery-claim-recovery.mjs`, `scripts/verify-ai-settlement-local.py`, suíte geral. Nenhuma chamada paga.
